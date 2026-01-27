/**
 * Tela Corredor Peso - Fazenda Digital
 * 
 * Estimativa de peso de animais por câmera no corredor
 * usando visão computacional
 * 
 * @version 4.0.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Dimensions,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// TIPOS
// ============================================================================

interface WeighStation {
  id: number;
  name: string;
  cameraId: number;
  cameraType: 'rgb' | 'depth';
  calibrationVersion: number;
  status: 'active' | 'inactive';
}

interface WeightEstimate {
  id: number;
  stationId: number;
  estimatedKg: number;
  confidence: number;
  calibrationVersion: number;
  capturedAt: string;
  animalId?: number;
  confirmedKg?: number;
}

interface CalibrationData {
  id: number;
  stationId: number;
  version: number;
  modelType: 'linear' | 'polynomial';
  coefficients: number[];
  rmse: number;
  samplesCount: number;
  createdAt: string;
}

// ============================================================================
// COMPONENTES
// ============================================================================

/**
 * Card de Estação de Pesagem
 */
const StationCard: React.FC<{
  station: WeighStation;
  lastEstimate: WeightEstimate | null;
  isSelected: boolean;
  onPress: () => void;
  colors: any;
}> = ({ station, lastEstimate, isSelected, onPress, colors }) => {
  const statusColor = station.status === 'active' ? colors.success : colors.muted;

  return (
    <TouchableOpacity
      style={[
        styles.stationCard,
        {
          backgroundColor: isSelected ? colors.primary + '20' : colors.surface,
          borderColor: isSelected ? colors.primary : colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.stationHeader}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={[styles.stationName, { color: colors.foreground }]}>
          {station.name}
        </Text>
      </View>
      
      <View style={styles.stationBody}>
        <Ionicons
          name={station.cameraType === 'depth' ? 'cube-outline' : 'camera-outline'}
          size={28}
          color={station.status === 'active' ? colors.primary : colors.muted}
        />
        
        <View style={styles.stationInfo}>
          {lastEstimate ? (
            <>
              <Text style={[styles.stationWeight, { color: colors.foreground }]}>
                {lastEstimate.estimatedKg.toFixed(0)} kg
              </Text>
              <Text style={[styles.stationConfidence, { color: colors.muted }]}>
                {Math.round(lastEstimate.confidence * 100)}% conf.
              </Text>
            </>
          ) : (
            <Text style={[styles.stationNoData, { color: colors.muted }]}>
              Aguardando...
            </Text>
          )}
        </View>
      </View>
      
      <View style={styles.stationFooter}>
        <Text style={[styles.stationCalibration, { color: colors.muted }]}>
          Calibração v{station.calibrationVersion}
        </Text>
        <Ionicons
          name="chevron-forward"
          size={16}
          color={colors.muted}
        />
      </View>
    </TouchableOpacity>
  );
};

/**
 * Display de Peso Atual
 */
const WeightDisplay: React.FC<{
  estimate: WeightEstimate | null;
  onConfirm: (weight: number) => void;
  colors: any;
}> = ({ estimate, onConfirm, colors }) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmedWeight, setConfirmedWeight] = useState('');

  if (!estimate) {
    return (
      <View style={[styles.weightDisplay, { backgroundColor: colors.surface }]}>
        <Ionicons name="scale-outline" size={48} color={colors.muted} />
        <Text style={[styles.weightPlaceholder, { color: colors.muted }]}>
          Posicione o animal no corredor
        </Text>
      </View>
    );
  }

  const confidencePercent = Math.round(estimate.confidence * 100);
  const confidenceColor = estimate.confidence >= 0.8 ? colors.success : estimate.confidence >= 0.6 ? colors.warning : colors.error;

  const handleConfirmPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setConfirmedWeight(estimate.estimatedKg.toFixed(0));
    setShowConfirmModal(true);
  };

  const handleSubmitConfirm = () => {
    const weight = parseFloat(confirmedWeight);
    if (isNaN(weight) || weight < 50 || weight > 2000) {
      Alert.alert('Erro', 'Digite um peso válido entre 50 e 2000 kg');
      return;
    }
    onConfirm(weight);
    setShowConfirmModal(false);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  return (
    <>
      <View style={[styles.weightDisplay, { backgroundColor: colors.surface }]}>
        <Text style={[styles.weightLabel, { color: colors.muted }]}>
          PESO ESTIMADO
        </Text>
        
        <View style={styles.weightRow}>
          <Ionicons name="scale" size={36} color={colors.primary} />
          <Text style={[styles.weightValue, { color: colors.foreground }]}>
            {estimate.estimatedKg.toFixed(0)}
          </Text>
          <Text style={[styles.weightUnit, { color: colors.muted }]}>
            kg
          </Text>
        </View>
        
        <View style={styles.weightConfidence}>
          <View style={[styles.confidenceBar, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.confidenceFill,
                {
                  backgroundColor: confidenceColor,
                  width: `${confidencePercent}%`,
                },
              ]}
            />
          </View>
          <Text style={[styles.confidenceText, { color: confidenceColor }]}>
            {confidencePercent}% confiança
          </Text>
        </View>
        
        <View style={styles.weightActions}>
          <TouchableOpacity
            style={[styles.confirmButton, { backgroundColor: colors.primary }]}
            onPress={handleConfirmPress}
          >
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.confirmButtonText}>Confirmar Peso</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.linkButton, { borderColor: colors.border }]}
            onPress={() => Alert.alert('Info', 'Funcionalidade de vincular animal em desenvolvimento')}
          >
            <Ionicons name="link" size={20} color={colors.primary} />
            <Text style={[styles.linkButtonText, { color: colors.primary }]}>
              Vincular Animal
            </Text>
          </TouchableOpacity>
        </View>
        
        <Text style={[styles.weightTime, { color: colors.muted }]}>
          {new Date(estimate.capturedAt).toLocaleTimeString('pt-BR')}
        </Text>
      </View>
      
      {/* Modal de Confirmação */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Confirmar Peso Real
            </Text>
            
            <Text style={[styles.modalSubtitle, { color: colors.muted }]}>
              Digite o peso real do animal para calibração
            </Text>
            
            <View style={[styles.modalInput, { borderColor: colors.border }]}>
              <TextInput
                style={[styles.modalInputText, { color: colors.foreground }]}
                value={confirmedWeight}
                onChangeText={setConfirmedWeight}
                keyboardType="numeric"
                placeholder="Peso em kg"
                placeholderTextColor={colors.muted}
              />
              <Text style={[styles.modalInputUnit, { color: colors.muted }]}>kg</Text>
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancel, { borderColor: colors.border }]}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={[styles.modalCancelText, { color: colors.foreground }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalSubmit, { backgroundColor: colors.primary }]}
                onPress={handleSubmitConfirm}
              >
                <Text style={styles.modalSubmitText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

/**
 * Histórico de Pesagens
 */
const WeightHistory: React.FC<{
  estimates: WeightEstimate[];
  colors: any;
}> = ({ estimates, colors }) => {
  if (estimates.length === 0) {
    return (
      <View style={[styles.historyContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.historyTitle, { color: colors.foreground }]}>
          Histórico de Pesagens
        </Text>
        <Text style={[styles.noData, { color: colors.muted }]}>
          Nenhuma pesagem registrada hoje
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.historyContainer, { backgroundColor: colors.surface }]}>
      <Text style={[styles.historyTitle, { color: colors.foreground }]}>
        Histórico de Pesagens (Hoje)
      </Text>
      
      {estimates.slice(0, 10).map((estimate, index) => (
        <View
          key={estimate.id}
          style={[
            styles.historyItem,
            { borderBottomColor: colors.border },
            index === estimates.length - 1 && { borderBottomWidth: 0 },
          ]}
        >
          <View style={styles.historyItemLeft}>
            <Text style={[styles.historyItemTime, { color: colors.muted }]}>
              {new Date(estimate.capturedAt).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
            <Text style={[styles.historyItemWeight, { color: colors.foreground }]}>
              {estimate.estimatedKg.toFixed(0)} kg
            </Text>
          </View>
          
          <View style={styles.historyItemRight}>
            <Text
              style={[
                styles.historyItemConfidence,
                {
                  color: estimate.confidence >= 0.8 ? colors.success : colors.warning,
                },
              ]}
            >
              {Math.round(estimate.confidence * 100)}%
            </Text>
            {estimate.confirmedKg && (
              <View style={[styles.confirmedBadge, { backgroundColor: colors.success + '20' }]}>
                <Ionicons name="checkmark" size={12} color={colors.success} />
                <Text style={[styles.confirmedText, { color: colors.success }]}>
                  {estimate.confirmedKg} kg
                </Text>
              </View>
            )}
          </View>
        </View>
      ))}
    </View>
  );
};

/**
 * Card de Calibração
 */
const CalibrationCard: React.FC<{
  calibration: CalibrationData | null;
  onRecalibrate: () => void;
  colors: any;
}> = ({ calibration, onRecalibrate, colors }) => {
  return (
    <View style={[styles.calibrationCard, { backgroundColor: colors.surface }]}>
      <View style={styles.calibrationHeader}>
        <Ionicons name="options" size={24} color={colors.primary} />
        <Text style={[styles.calibrationTitle, { color: colors.foreground }]}>
          Calibração
        </Text>
      </View>
      
      {calibration ? (
        <>
          <View style={styles.calibrationInfo}>
            <View style={styles.calibrationRow}>
              <Text style={[styles.calibrationLabel, { color: colors.muted }]}>
                Versão:
              </Text>
              <Text style={[styles.calibrationValue, { color: colors.foreground }]}>
                v{calibration.version}
              </Text>
            </View>
            
            <View style={styles.calibrationRow}>
              <Text style={[styles.calibrationLabel, { color: colors.muted }]}>
                Modelo:
              </Text>
              <Text style={[styles.calibrationValue, { color: colors.foreground }]}>
                {calibration.modelType === 'linear' ? 'Linear' : 'Polinomial'}
              </Text>
            </View>
            
            <View style={styles.calibrationRow}>
              <Text style={[styles.calibrationLabel, { color: colors.muted }]}>
                Erro (RMSE):
              </Text>
              <Text style={[styles.calibrationValue, { color: colors.foreground }]}>
                ±{calibration.rmse.toFixed(1)} kg
              </Text>
            </View>
            
            <View style={styles.calibrationRow}>
              <Text style={[styles.calibrationLabel, { color: colors.muted }]}>
                Amostras:
              </Text>
              <Text style={[styles.calibrationValue, { color: colors.foreground }]}>
                {calibration.samplesCount}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={[styles.recalibrateButton, { borderColor: colors.primary }]}
            onPress={onRecalibrate}
          >
            <Ionicons name="refresh" size={18} color={colors.primary} />
            <Text style={[styles.recalibrateText, { color: colors.primary }]}>
              Recalibrar
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.noCalibration}>
          <Text style={[styles.noCalibrationText, { color: colors.muted }]}>
            Nenhuma calibração disponível
          </Text>
          <TouchableOpacity
            style={[styles.calibrateButton, { backgroundColor: colors.primary }]}
            onPress={onRecalibrate}
          >
            <Text style={styles.calibrateButtonText}>Iniciar Calibração</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// ============================================================================
// TELA PRINCIPAL
// ============================================================================

export default function PesoScreen() {
  const colors = useColors();
  
  // Estados
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stations, setStations] = useState<WeighStation[]>([]);
  const [selectedStation, setSelectedStation] = useState<number | null>(null);
  const [currentEstimate, setCurrentEstimate] = useState<WeightEstimate | null>(null);
  const [estimates, setEstimates] = useState<WeightEstimate[]>([]);
  const [calibration, setCalibration] = useState<CalibrationData | null>(null);
  
  // Carregar dados
  const loadData = useCallback(async () => {
    try {
      // Simular dados para demonstração
      // Em produção, usar API real
      
      const mockStations: WeighStation[] = [
        {
          id: 1,
          name: 'Corredor Principal',
          cameraId: 5,
          cameraType: 'rgb',
          calibrationVersion: 3,
          status: 'active',
        },
        {
          id: 2,
          name: 'Corredor Secundário',
          cameraId: 6,
          cameraType: 'depth',
          calibrationVersion: 2,
          status: 'inactive',
        },
      ];
      
      setStations(mockStations);
      
      // Selecionar primeira estação ativa
      if (!selectedStation) {
        const activeStation = mockStations.find(s => s.status === 'active');
        if (activeStation) {
          setSelectedStation(activeStation.id);
        }
      }
      
      // Estimativa atual simulada
      const mockEstimate: WeightEstimate = {
        id: Date.now(),
        stationId: 1,
        estimatedKg: 380 + Math.random() * 50,
        confidence: 0.75 + Math.random() * 0.2,
        calibrationVersion: 3,
        capturedAt: new Date().toISOString(),
      };
      setCurrentEstimate(mockEstimate);
      
      // Histórico simulado
      const mockHistory: WeightEstimate[] = [];
      for (let i = 0; i < 15; i++) {
        mockHistory.push({
          id: i + 1,
          stationId: 1,
          estimatedKg: 350 + Math.random() * 100,
          confidence: 0.7 + Math.random() * 0.25,
          calibrationVersion: 3,
          capturedAt: new Date(Date.now() - i * 1800000).toISOString(),
          confirmedKg: i < 5 ? Math.round(350 + Math.random() * 100) : undefined,
        });
      }
      setEstimates(mockHistory);
      
      // Calibração simulada
      setCalibration({
        id: 1,
        stationId: 1,
        version: 3,
        modelType: 'linear',
        coefficients: [2.5, 150],
        rmse: 12.5,
        samplesCount: 47,
        createdAt: new Date(Date.now() - 7 * 24 * 3600000).toISOString(),
      });
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedStation]);
  
  // Carregar dados iniciais
  useEffect(() => {
    loadData();
    
    // Atualizar a cada 3 segundos
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [loadData]);
  
  // Handlers
  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };
  
  const handleStationPress = (stationId: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedStation(stationId);
  };
  
  const handleConfirmWeight = (weight: number) => {
    // Em produção, enviar para API
    console.log('Peso confirmado:', weight);
    Alert.alert('Sucesso', `Peso de ${weight} kg confirmado e enviado para calibração`);
  };
  
  const handleRecalibrate = () => {
    Alert.alert(
      'Recalibrar',
      'Deseja iniciar uma nova calibração? Isso requer pelo menos 20 amostras confirmadas.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Iniciar',
          onPress: () => {
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            Alert.alert('Info', 'Calibração iniciada. Confirme os pesos dos próximos animais.');
          },
        },
      ]
    );
  };
  
  // Render
  if (loading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.muted }]}>
          Conectando às estações de pesagem...
        </Text>
      </ScreenContainer>
    );
  }
  
  const selectedStationData = stations.find(s => s.id === selectedStation);
  
  return (
    <ScreenContainer>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.foreground }]}>
              Corredor Peso
            </Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Estimativa por visão computacional
            </Text>
          </View>
        </View>
        
        {/* Estações */}
        <View style={styles.stationsSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Estações de Pesagem
          </Text>
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.stationsScroll}
          >
            {stations.map(station => (
              <StationCard
                key={station.id}
                station={station}
                lastEstimate={
                  estimates.find(e => e.stationId === station.id) || null
                }
                isSelected={selectedStation === station.id}
                onPress={() => handleStationPress(station.id)}
                colors={colors}
              />
            ))}
          </ScrollView>
        </View>
        
        {/* Display de Peso */}
        {selectedStationData?.status === 'active' ? (
          <WeightDisplay
            estimate={currentEstimate}
            onConfirm={handleConfirmWeight}
            colors={colors}
          />
        ) : (
          <View style={[styles.inactiveStation, { backgroundColor: colors.surface }]}>
            <Ionicons name="warning" size={32} color={colors.warning} />
            <Text style={[styles.inactiveText, { color: colors.foreground }]}>
              Estação Inativa
            </Text>
            <Text style={[styles.inactiveSubtext, { color: colors.muted }]}>
              Selecione uma estação ativa para ver estimativas
            </Text>
          </View>
        )}
        
        {/* Calibração */}
        <CalibrationCard
          calibration={calibration}
          onRecalibrate={handleRecalibrate}
          colors={colors}
        />
        
        {/* Histórico */}
        <WeightHistory estimates={estimates} colors={colors} />
        
        {/* Info */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.muted }]}>
            A estimativa de peso usa visão computacional com IA. Confirme os pesos reais para melhorar a precisão da calibração.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

// ============================================================================
// ESTILOS
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  
  // Header
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  
  // Stations
  stationsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  stationsScroll: {
    gap: 12,
  },
  stationCard: {
    width: 180,
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
  },
  stationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stationName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  stationBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  stationInfo: {
    flex: 1,
  },
  stationWeight: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  stationConfidence: {
    fontSize: 12,
  },
  stationNoData: {
    fontSize: 14,
  },
  stationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stationCalibration: {
    fontSize: 11,
  },
  
  // Weight Display
  weightDisplay: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  weightLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 8,
  },
  weightPlaceholder: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  weightValue: {
    fontSize: 64,
    fontWeight: 'bold',
  },
  weightUnit: {
    fontSize: 24,
  },
  weightConfidence: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    width: '100%',
  },
  confidenceBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 3,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 100,
    textAlign: 'right',
  },
  weightActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    width: '100%',
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  linkButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  linkButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  weightTime: {
    fontSize: 11,
    marginTop: 12,
  },
  
  // Inactive Station
  inactiveStation: {
    borderRadius: 16,
    padding: 32,
    marginBottom: 20,
    alignItems: 'center',
  },
  inactiveText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
  inactiveSubtext: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  
  // Calibration
  calibrationCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  calibrationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  calibrationTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  calibrationInfo: {
    gap: 8,
    marginBottom: 16,
  },
  calibrationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calibrationLabel: {
    fontSize: 14,
  },
  calibrationValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  recalibrateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  recalibrateText: {
    fontSize: 14,
    fontWeight: '600',
  },
  noCalibration: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  noCalibrationText: {
    fontSize: 14,
    marginBottom: 16,
  },
  calibrateButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  calibrateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // History
  historyContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  noData: {
    textAlign: 'center',
    paddingVertical: 20,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  historyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  historyItemTime: {
    fontSize: 12,
    width: 50,
  },
  historyItemWeight: {
    fontSize: 16,
    fontWeight: '600',
  },
  historyItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  historyItemConfidence: {
    fontSize: 12,
    fontWeight: '600',
  },
  confirmedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confirmedText: {
    fontSize: 11,
    fontWeight: '600',
  },
  
  // Info
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  modalInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  modalInputText: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    paddingVertical: 16,
  },
  modalInputUnit: {
    fontSize: 18,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalSubmit: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalSubmitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
