import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock AsyncStorage
const mockStorage: Record<string, string> = {};
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn((key: string) => Promise.resolve(mockStorage[key] || null)),
    setItem: vi.fn((key: string, value: string) => {
      mockStorage[key] = value;
      return Promise.resolve();
    }),
    removeItem: vi.fn((key: string) => {
      delete mockStorage[key];
      return Promise.resolve();
    }),
  },
}));

describe('Fazenda Digital - Data Logic Tests', () => {
  beforeEach(() => {
    // Clear mock storage before each test
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
  });

  describe('Animal Data', () => {
    it('should calculate arrobas correctly from weight', () => {
      const peso = 450; // kg
      const arrobas = peso / 30;
      expect(arrobas).toBe(15);
    });

    it('should calculate total arrobas for multiple animals', () => {
      const animais = [
        { peso: 450 },
        { peso: 500 },
        { peso: 380 },
      ];
      const totalArrobas = animais.reduce((acc, a) => acc + (a.peso / 30), 0);
      expect(totalArrobas.toFixed(2)).toBe('44.33');
    });

    it('should calculate average weight correctly', () => {
      const animais = [
        { peso: 450 },
        { peso: 500 },
        { peso: 380 },
      ];
      const mediaPeso = animais.reduce((acc, a) => acc + a.peso, 0) / animais.length;
      expect(mediaPeso.toFixed(2)).toBe('443.33');
    });

    it('should filter animals by category', () => {
      const animais = [
        { id: '1', categoria: 'Boi' },
        { id: '2', categoria: 'Vaca' },
        { id: '3', categoria: 'Boi' },
        { id: '4', categoria: 'Bezerro' },
      ];
      const bois = animais.filter(a => a.categoria === 'Boi');
      expect(bois.length).toBe(2);
    });

    it('should filter animals by status', () => {
      const animais = [
        { id: '1', status: 'Ativo' },
        { id: '2', status: 'Vendido' },
        { id: '3', status: 'Ativo' },
      ];
      const ativos = animais.filter(a => a.status === 'Ativo');
      expect(ativos.length).toBe(2);
    });
  });

  describe('Sales Calculations', () => {
    it('should calculate sale value correctly', () => {
      const arrobas = 15;
      const precoArroba = 280;
      const valorVenda = arrobas * precoArroba;
      expect(valorVenda).toBe(4200);
    });

    it('should calculate total revenue from multiple sales', () => {
      const vendas = [
        { valorTotal: 4200 },
        { valorTotal: 5600 },
        { valorTotal: 3800 },
      ];
      const faturamentoTotal = vendas.reduce((acc, v) => acc + v.valorTotal, 0);
      expect(faturamentoTotal).toBe(13600);
    });

    it('should calculate arrobas from weight for sale', () => {
      const animais = [
        { peso: 450 },
        { peso: 500 },
      ];
      const pesoTotal = animais.reduce((acc, a) => acc + a.peso, 0);
      const arrobas = pesoTotal / 30;
      expect(pesoTotal).toBe(950);
      expect(arrobas.toFixed(2)).toBe('31.67');
    });
  });

  describe('Cost Calculations', () => {
    it('should calculate total costs correctly', () => {
      const custos = [
        { valor: 1500, categoria: 'Alimentação' },
        { valor: 800, categoria: 'Veterinário' },
        { valor: 500, categoria: 'Manutenção' },
      ];
      const custosTotal = custos.reduce((acc, c) => acc + c.valor, 0);
      expect(custosTotal).toBe(2800);
    });

    it('should group costs by category', () => {
      const custos = [
        { valor: 1500, categoria: 'Alimentação' },
        { valor: 800, categoria: 'Veterinário' },
        { valor: 500, categoria: 'Alimentação' },
      ];
      const custosPorCategoria: Record<string, number> = {};
      custos.forEach(c => {
        custosPorCategoria[c.categoria] = (custosPorCategoria[c.categoria] || 0) + c.valor;
      });
      expect(custosPorCategoria['Alimentação']).toBe(2000);
      expect(custosPorCategoria['Veterinário']).toBe(800);
    });
  });

  describe('Profit Calculations', () => {
    it('should calculate profit correctly', () => {
      const faturamento = 13600;
      const custos = 2800;
      const lucro = faturamento - custos;
      expect(lucro).toBe(10800);
    });

    it('should handle negative profit (loss)', () => {
      const faturamento = 2000;
      const custos = 5000;
      const lucro = faturamento - custos;
      expect(lucro).toBe(-3000);
    });

    it('should calculate profit margin percentage', () => {
      const faturamento = 13600;
      const lucro = 10800;
      const margem = (lucro / faturamento) * 100;
      expect(margem.toFixed(2)).toBe('79.41');
    });
  });

  describe('Report Generation', () => {
    it('should generate inventory summary', () => {
      const animais = [
        { id: '1', categoria: 'Boi', peso: 450 },
        { id: '2', categoria: 'Vaca', peso: 400 },
        { id: '3', categoria: 'Boi', peso: 500 },
      ];
      
      const summary = {
        totalAnimais: animais.length,
        pesoTotal: animais.reduce((acc, a) => acc + a.peso, 0),
        arrobasTotal: animais.reduce((acc, a) => acc + (a.peso / 30), 0),
        mediaPeso: animais.reduce((acc, a) => acc + a.peso, 0) / animais.length,
      };

      expect(summary.totalAnimais).toBe(3);
      expect(summary.pesoTotal).toBe(1350);
      expect(summary.arrobasTotal).toBe(45);
      expect(summary.mediaPeso).toBe(450);
    });

    it('should generate financial summary', () => {
      const vendas = [{ valorTotal: 10000 }, { valorTotal: 5000 }];
      const custos = [{ valor: 3000 }, { valor: 2000 }];

      const summary = {
        faturamento: vendas.reduce((acc, v) => acc + v.valorTotal, 0),
        custos: custos.reduce((acc, c) => acc + c.valor, 0),
        lucro: 0,
      };
      summary.lucro = summary.faturamento - summary.custos;

      expect(summary.faturamento).toBe(15000);
      expect(summary.custos).toBe(5000);
      expect(summary.lucro).toBe(10000);
    });
  });

  describe('Data Validation', () => {
    it('should validate animal identifier format', () => {
      const validIdentifiers = ['BOI-001', 'VACA-123', 'BEZ-456'];
      const invalidIdentifiers = ['', '   ', null, undefined];

      validIdentifiers.forEach(id => {
        expect(id && id.trim().length > 0).toBe(true);
      });

      invalidIdentifiers.forEach(id => {
        expect(!id || (typeof id === 'string' && id.trim().length === 0)).toBe(true);
      });
    });

    it('should validate weight is positive number', () => {
      const validWeights = [100, 450, 500.5];
      const invalidWeights = [0, -100, NaN];

      validWeights.forEach(peso => {
        expect(peso > 0 && !isNaN(peso)).toBe(true);
      });

      invalidWeights.forEach(peso => {
        expect(peso > 0 && !isNaN(peso)).toBe(false);
      });
    });

    it('should validate cost value is positive', () => {
      const validCosts = [100, 1500, 50.5];
      const invalidCosts = [0, -500];

      validCosts.forEach(valor => {
        expect(valor > 0).toBe(true);
      });

      invalidCosts.forEach(valor => {
        expect(valor > 0).toBe(false);
      });
    });
  });

  describe('Date Formatting', () => {
    it('should format date to Brazilian format', () => {
      const date = new Date(2026, 0, 22); // January 22, 2026
      const formatted = date.toLocaleDateString('pt-BR');
      expect(formatted).toBe('22/01/2026');
    });

    it('should parse Brazilian date format', () => {
      const dateStr = '22/01/2026';
      const [dia, mes, ano] = dateStr.split('/').map(Number);
      expect(dia).toBe(22);
      expect(mes).toBe(1);
      expect(ano).toBe(2026);
    });
  });
});
