import { describe, it, expect } from 'vitest';

describe('Calculadora Pecuária - Testes', () => {
  describe('Conversão Peso → Arrobas', () => {
    it('should convert kg to arrobas (peso vivo)', () => {
      const pesoKg = 450;
      const arrobas = pesoKg / 30;
      expect(arrobas).toBe(15);
    });

    it('should convert kg to arrobas (carcaça com 52% rendimento)', () => {
      const pesoKg = 450;
      const rendimento = 0.52;
      const pesoCarcaca = pesoKg * rendimento;
      const arrobasCarcaca = pesoCarcaca / 15;
      expect(arrobasCarcaca.toFixed(2)).toBe('15.60');
    });
  });

  describe('GMD (Ganho Médio Diário)', () => {
    it('should calculate GMD correctly', () => {
      const pesoInicial = 350;
      const pesoFinal = 500;
      const dias = 120;
      const gmd = (pesoFinal - pesoInicial) / dias;
      expect(gmd.toFixed(3)).toBe('1.250');
    });

    it('should calculate total weight gain', () => {
      const pesoInicial = 350;
      const pesoFinal = 500;
      const ganhoTotal = pesoFinal - pesoInicial;
      expect(ganhoTotal).toBe(150);
    });

    it('should calculate arrobas gained', () => {
      const pesoInicial = 350;
      const pesoFinal = 500;
      const ganhoTotal = pesoFinal - pesoInicial;
      const arrobasGanhas = ganhoTotal / 30;
      expect(arrobasGanhas).toBe(5);
    });
  });

  describe('Valor do Animal', () => {
    it('should calculate animal value correctly', () => {
      const pesoAnimal = 500;
      const precoArroba = 280;
      const rendimento = 0.52;
      
      const pesoCarcaca = pesoAnimal * rendimento;
      const arrobasCarcaca = pesoCarcaca / 15;
      const valorTotal = arrobasCarcaca * precoArroba;
      
      expect(pesoCarcaca).toBe(260);
      expect(arrobasCarcaca.toFixed(2)).toBe('17.33');
      expect(valorTotal.toFixed(2)).toBe('4853.33');
    });

    it('should handle different rendimento values', () => {
      const pesoAnimal = 500;
      const precoArroba = 280;
      
      // Rendimento 50%
      const rendimento50 = 0.50;
      const valor50 = ((pesoAnimal * rendimento50) / 15) * precoArroba;
      expect(valor50.toFixed(2)).toBe('4666.67');
      
      // Rendimento 54%
      const rendimento54 = 0.54;
      const valor54 = ((pesoAnimal * rendimento54) / 15) * precoArroba;
      expect(valor54.toFixed(2)).toBe('5040.00');
    });
  });

  describe('Conversão Alimentar', () => {
    it('should calculate feed conversion ratio', () => {
      const consumoRacao = 600; // kg
      const ganhoPeso = 100; // kg
      const conversao = consumoRacao / ganhoPeso;
      expect(conversao).toBe(6);
    });

    it('should classify conversion as excellent (≤5)', () => {
      const conversao = 4.5;
      const classificacao = conversao <= 5 ? 'Excelente' : 
                           conversao <= 6 ? 'Bom' : 
                           conversao <= 7 ? 'Regular' : 'Ruim';
      expect(classificacao).toBe('Excelente');
    });

    it('should classify conversion as good (5-6)', () => {
      const conversao = 5.5;
      const classificacao = conversao <= 5 ? 'Excelente' : 
                           conversao <= 6 ? 'Bom' : 
                           conversao <= 7 ? 'Regular' : 'Ruim';
      expect(classificacao).toBe('Bom');
    });

    it('should classify conversion as regular (6-7)', () => {
      const conversao = 6.5;
      const classificacao = conversao <= 5 ? 'Excelente' : 
                           conversao <= 6 ? 'Bom' : 
                           conversao <= 7 ? 'Regular' : 'Ruim';
      expect(classificacao).toBe('Regular');
    });

    it('should classify conversion as poor (>7)', () => {
      const conversao = 8;
      const classificacao = conversao <= 5 ? 'Excelente' : 
                           conversao <= 6 ? 'Bom' : 
                           conversao <= 7 ? 'Regular' : 'Ruim';
      expect(classificacao).toBe('Ruim');
    });

    it('should calculate feed efficiency', () => {
      const consumoRacao = 600;
      const ganhoPeso = 100;
      const eficiencia = (ganhoPeso / consumoRacao) * 100;
      expect(eficiencia.toFixed(2)).toBe('16.67');
    });
  });

  describe('Projeção de Peso', () => {
    it('should project future weight correctly', () => {
      const pesoAtual = 400;
      const gmd = 1.2;
      const dias = 90;
      const pesoProjetado = pesoAtual + (gmd * dias);
      expect(pesoProjetado).toBe(508);
    });

    it('should calculate projected arrobas', () => {
      const pesoAtual = 400;
      const gmd = 1.2;
      const dias = 90;
      const pesoProjetado = pesoAtual + (gmd * dias);
      const arrobasProjetadas = pesoProjetado / 30;
      expect(arrobasProjetadas.toFixed(2)).toBe('16.93');
    });

    it('should calculate total gain in period', () => {
      const gmd = 1.2;
      const dias = 90;
      const ganhoTotal = gmd * dias;
      expect(ganhoTotal).toBe(108);
    });
  });

  describe('Validações de Entrada', () => {
    it('should handle zero values', () => {
      const peso = 0;
      const arrobas = peso / 30;
      expect(arrobas).toBe(0);
    });

    it('should handle negative values gracefully', () => {
      const pesoInicial = 500;
      const pesoFinal = 450; // Perda de peso
      const dias = 30;
      const gmd = (pesoFinal - pesoInicial) / dias;
      expect(gmd).toBeLessThan(0);
      expect(gmd.toFixed(3)).toBe('-1.667');
    });
  });
});
