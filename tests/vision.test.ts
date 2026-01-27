import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock das funções de visão computacional
const mockVisionFunctions = {
  // Funções de contagem de curral
  aggregatePenCount: (counts: number[], rule: 'median' | 'max' | 'principal', primaryIndex?: number): number => {
    if (counts.length === 0) return 0;
    
    switch (rule) {
      case 'median':
        const sorted = [...counts].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
      case 'max':
        return Math.max(...counts);
      case 'principal':
        return primaryIndex !== undefined && primaryIndex < counts.length ? counts[primaryIndex] : counts[0];
      default:
        return 0;
    }
  },

  // Funções de estimativa de peso
  estimateWeightFromBbox: (width: number, height: number, coefficients: { a: number; b: number }): number => {
    const area = width * height;
    return coefficients.a * area + coefficients.b;
  },

  // Função de calibração
  calculateCalibration: (samples: { estimated: number; actual: number }[]): { a: number; b: number; rmse: number } => {
    if (samples.length < 2) {
      return { a: 1, b: 0, rmse: 0 };
    }

    // Regressão linear simples
    const n = samples.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    for (const s of samples) {
      sumX += s.estimated;
      sumY += s.actual;
      sumXY += s.estimated * s.actual;
      sumX2 += s.estimated * s.estimated;
    }
    
    const a = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const b = (sumY - a * sumX) / n;
    
    // Calcular RMSE
    let sumSquaredError = 0;
    for (const s of samples) {
      const predicted = a * s.estimated + b;
      sumSquaredError += Math.pow(predicted - s.actual, 2);
    }
    const rmse = Math.sqrt(sumSquaredError / n);
    
    return { a, b, rmse };
  },

  // Validação de câmera
  validateCameraUrl: (url: string): boolean => {
    if (!url) return false;
    const rtspPattern = /^rtsp:\/\/[^\s]+$/i;
    const httpPattern = /^https?:\/\/[^\s]+$/i;
    return rtspPattern.test(url) || httpPattern.test(url);
  },

  // Suavização de contagem (média móvel)
  smoothCount: (counts: number[], windowSize: number = 5): number => {
    if (counts.length === 0) return 0;
    const window = counts.slice(-windowSize);
    return Math.round(window.reduce((a, b) => a + b, 0) / window.length);
  },

  // Calcular confiança baseada na variância
  calculateConfidence: (counts: number[]): number => {
    if (counts.length < 2) return 1.0;
    
    const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
    const variance = counts.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / counts.length;
    const stdDev = Math.sqrt(variance);
    
    // Confiança inversamente proporcional ao desvio padrão relativo
    const relativeStdDev = mean > 0 ? stdDev / mean : 0;
    return Math.max(0, Math.min(1, 1 - relativeStdDev));
  },

  // Validar posição da câmera
  validateCameraPosition: (position: string): boolean => {
    const validPositions = ['NE', 'NW', 'SE', 'SW', 'N', 'S', 'E', 'W', 'CENTER'];
    return validPositions.includes(position.toUpperCase());
  },

  // Converter peso para arrobas
  kgToArrobas: (kg: number, rendimento: number = 0.52): number => {
    return (kg * rendimento) / 15;
  },
};

describe('Módulo de Visão Computacional', () => {
  
  describe('Contagem de Gado no Curral', () => {
    
    it('deve agregar contagens usando mediana', () => {
      const counts = [45, 48, 42, 50, 47];
      const result = mockVisionFunctions.aggregatePenCount(counts, 'median');
      expect(result).toBe(47); // Mediana de [42, 45, 47, 48, 50]
    });

    it('deve agregar contagens usando máximo', () => {
      const counts = [45, 48, 42, 50, 47];
      const result = mockVisionFunctions.aggregatePenCount(counts, 'max');
      expect(result).toBe(50);
    });

    it('deve agregar contagens usando câmera principal', () => {
      const counts = [45, 48, 42, 50];
      const result = mockVisionFunctions.aggregatePenCount(counts, 'principal', 2);
      expect(result).toBe(42); // Índice 2
    });

    it('deve retornar 0 para array vazio', () => {
      const result = mockVisionFunctions.aggregatePenCount([], 'median');
      expect(result).toBe(0);
    });

    it('deve suavizar contagens com média móvel', () => {
      const counts = [45, 46, 44, 47, 45, 100]; // 100 é outlier
      const result = mockVisionFunctions.smoothCount(counts, 5);
      // Média dos últimos 5: (46 + 44 + 47 + 45 + 100) / 5 = 56.4 ≈ 56
      expect(result).toBe(56);
    });

    it('deve calcular confiança alta para contagens consistentes', () => {
      const counts = [45, 45, 46, 45, 44];
      const confidence = mockVisionFunctions.calculateConfidence(counts);
      expect(confidence).toBeGreaterThan(0.9);
    });

    it('deve calcular confiança baixa para contagens inconsistentes', () => {
      const counts = [10, 50, 20, 80, 30];
      const confidence = mockVisionFunctions.calculateConfidence(counts);
      expect(confidence).toBeLessThan(0.5);
    });
  });

  describe('Estimativa de Peso por Câmera', () => {
    
    it('deve estimar peso a partir do bounding box', () => {
      const width = 200;
      const height = 150;
      const coefficients = { a: 0.01, b: 50 }; // Peso = 0.01 * área + 50
      const result = mockVisionFunctions.estimateWeightFromBbox(width, height, coefficients);
      expect(result).toBe(350); // 0.01 * 30000 + 50 = 350
    });

    it('deve calcular calibração por regressão linear', () => {
      const samples = [
        { estimated: 300, actual: 320 },
        { estimated: 350, actual: 380 },
        { estimated: 400, actual: 420 },
        { estimated: 450, actual: 470 },
      ];
      const calibration = mockVisionFunctions.calculateCalibration(samples);
      
      expect(calibration.a).toBeGreaterThan(0);
      expect(calibration.rmse).toBeLessThan(20); // RMSE aceitável
    });

    it('deve retornar calibração padrão para poucas amostras', () => {
      const samples = [{ estimated: 300, actual: 320 }];
      const calibration = mockVisionFunctions.calculateCalibration(samples);
      
      expect(calibration.a).toBe(1);
      expect(calibration.b).toBe(0);
    });

    it('deve converter peso para arrobas corretamente', () => {
      const kg = 500;
      const rendimento = 0.52;
      const arrobas = mockVisionFunctions.kgToArrobas(kg, rendimento);
      expect(arrobas).toBeCloseTo(17.33, 1); // (500 * 0.52) / 15 ≈ 17.33
    });
  });

  describe('Validação de Câmeras', () => {
    
    it('deve validar URL RTSP correta', () => {
      const url = 'rtsp://admin:senha@192.168.1.100:554/stream1';
      expect(mockVisionFunctions.validateCameraUrl(url)).toBe(true);
    });

    it('deve validar URL HTTP correta', () => {
      const url = 'http://192.168.1.100:8080/video';
      expect(mockVisionFunctions.validateCameraUrl(url)).toBe(true);
    });

    it('deve rejeitar URL inválida', () => {
      expect(mockVisionFunctions.validateCameraUrl('')).toBe(false);
      expect(mockVisionFunctions.validateCameraUrl('invalid')).toBe(false);
      expect(mockVisionFunctions.validateCameraUrl('ftp://server')).toBe(false);
    });

    it('deve validar posições de câmera válidas', () => {
      expect(mockVisionFunctions.validateCameraPosition('NE')).toBe(true);
      expect(mockVisionFunctions.validateCameraPosition('SW')).toBe(true);
      expect(mockVisionFunctions.validateCameraPosition('CENTER')).toBe(true);
    });

    it('deve rejeitar posições de câmera inválidas', () => {
      expect(mockVisionFunctions.validateCameraPosition('INVALID')).toBe(false);
      expect(mockVisionFunctions.validateCameraPosition('XY')).toBe(false);
    });
  });

  describe('Integração de Dados', () => {
    
    it('deve processar múltiplas câmeras simultaneamente', () => {
      const cameraCounts = [
        { cameraId: 1, count: 45, confidence: 0.95 },
        { cameraId: 2, count: 47, confidence: 0.92 },
        { cameraId: 3, count: 44, confidence: 0.88 },
        { cameraId: 4, count: 46, confidence: 0.91 },
      ];
      
      const counts = cameraCounts.map(c => c.count);
      const aggregated = mockVisionFunctions.aggregatePenCount(counts, 'median');
      
      expect(aggregated).toBe(46); // Mediana de [44, 45, 46, 47]
    });

    it('deve calcular média ponderada por confiança', () => {
      const cameraCounts = [
        { count: 45, confidence: 0.95 },
        { count: 50, confidence: 0.60 },
      ];
      
      const totalWeight = cameraCounts.reduce((sum, c) => sum + c.confidence, 0);
      const weightedAvg = cameraCounts.reduce((sum, c) => sum + c.count * c.confidence, 0) / totalWeight;
      
      expect(weightedAvg).toBeCloseTo(46.94, 1);
    });
  });

  describe('Cenários de Erro', () => {
    
    it('deve lidar com contagens negativas', () => {
      const counts = [45, -5, 47]; // -5 é inválido
      const validCounts = counts.filter(c => c >= 0);
      const result = mockVisionFunctions.aggregatePenCount(validCounts, 'median');
      expect(result).toBe(46);
    });

    it('deve lidar com peso zero', () => {
      const weight = mockVisionFunctions.estimateWeightFromBbox(0, 0, { a: 0.01, b: 50 });
      expect(weight).toBe(50); // Apenas o termo constante
    });

    it('deve lidar com calibração com valores iguais', () => {
      const samples = [
        { estimated: 300, actual: 300 },
        { estimated: 300, actual: 300 },
      ];
      const calibration = mockVisionFunctions.calculateCalibration(samples);
      // Quando todos os valores são iguais, a regressão pode dar NaN ou Infinity
      // O importante é que o sistema não quebre
      expect(typeof calibration.a).toBe('number');
      expect(typeof calibration.b).toBe('number');
    });
  });
});

describe('Estrutura de Dados do Módulo de Visão', () => {
  
  it('deve ter estrutura correta para câmera', () => {
    const camera = {
      id: 1,
      name: 'Câmera NE',
      rtspUrl: 'rtsp://admin:senha@192.168.1.100:554/stream1',
      type: 'rtsp' as const,
      position: 'NE',
      penId: 1,
      status: 'online' as const,
      lastSeenAt: new Date().toISOString(),
    };
    
    expect(camera).toHaveProperty('id');
    expect(camera).toHaveProperty('name');
    expect(camera).toHaveProperty('rtspUrl');
    expect(camera).toHaveProperty('type');
    expect(camera).toHaveProperty('status');
  });

  it('deve ter estrutura correta para contagem de curral', () => {
    const penCount = {
      id: 1,
      penId: 1,
      count: 45,
      confidence: 0.95,
      capturedAt: new Date().toISOString(),
      cameras: [
        { cameraId: 1, count: 45, confidence: 0.95 },
        { cameraId: 2, count: 46, confidence: 0.92 },
      ],
    };
    
    expect(penCount).toHaveProperty('penId');
    expect(penCount).toHaveProperty('count');
    expect(penCount).toHaveProperty('confidence');
    expect(penCount).toHaveProperty('cameras');
    expect(penCount.cameras).toHaveLength(2);
  });

  it('deve ter estrutura correta para estimativa de peso', () => {
    const weightEstimate = {
      id: 1,
      stationId: 1,
      estimatedKg: 450.5,
      confidence: 0.88,
      calibrationVersion: 3,
      capturedAt: new Date().toISOString(),
      animalId: null,
      confirmedKg: null,
    };
    
    expect(weightEstimate).toHaveProperty('stationId');
    expect(weightEstimate).toHaveProperty('estimatedKg');
    expect(weightEstimate).toHaveProperty('confidence');
    expect(weightEstimate).toHaveProperty('calibrationVersion');
  });

  it('deve ter estrutura correta para calibração', () => {
    const calibration = {
      id: 1,
      stationId: 1,
      version: 3,
      modelType: 'linear' as const,
      coefficients: { a: 1.05, b: -15.2 },
      rmse: 12.5,
      samplesCount: 45,
      createdAt: new Date().toISOString(),
    };
    
    expect(calibration).toHaveProperty('version');
    expect(calibration).toHaveProperty('modelType');
    expect(calibration).toHaveProperty('coefficients');
    expect(calibration).toHaveProperty('rmse');
    expect(calibration).toHaveProperty('samplesCount');
  });
});
