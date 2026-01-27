/**
 * Tela Curral ao Vivo - Fazenda Digital
 * 
 * Visualização em tempo real da contagem de gado no curral
 * com suporte a múltiplas câmeras (até 4)
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
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// TIPOS
// ============================================================================

interface CameraStatus {
  id: number;
  name: string;
  status: 'online' | 'offline' | 'error';
  lastSeenAt: string | null;
  position: string | null;
  count?: number;
  confidence?: number;
}

interface PenCount {
  penId: number;
  count: number;
  confidence: number;
  capturedAt: string;
  cameras: {
    cameraId: number;
    count: number;
    confidence: number;
  }[];
}

interface CountHistory {
  label: string;
  count: number;
}

// ============================================================================
// COMPONENTES
// ============================================================================

/**
 * Card de Câmera Individual
 */
const CameraCard: React.FC<{
  camera: CameraStatus;
  isSelected: boolean;
  onPress: () => void;
  colors: any;
}> = ({ camera, isSelected, onPress, colors }) => {
  const statusColor = {
    online: colors.success,
    offline: colors.muted,
    error: colors.error,
  }[camera.status];

  return (
    <TouchableOpacity
      style={[
        styles.cameraCard,
        {
          backgroundColor: isSelected ? colors.primary + '20' : colors.surface,
          borderColor: isSelected ? colors.primary : colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cameraHeader}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={[styles.cameraPosition, { color: colors.foreground }]}>
          {camera.position || 'CAM'}
        </Text>
      </View>
      
      <View style={styles.cameraBody}>
        <Ionicons
          name="videocam"
          size={32}
          color={camera.status === 'online' ? colors.primary : colors.muted}
        />
        <Text style={[styles.cameraCount, { color: colors.foreground }]}>
          {camera.count ?? '--'}
        </Text>
      </View>
      
      <Text style={[styles.cameraName, { color: colors.muted }]} numberOfLines={1}>
        {camera.name}
      </Text>
    </TouchableOpacity>
  );
};

/**
 * Display Principal de Contagem
 */
const CountDisplay: React.FC<{
  count: number;
  confidence: number;
  lastUpdate: string | null;
  colors: any;
}> = ({ count, confidence, lastUpdate, colors }) => {
  const confidencePercent = Math.round(confidence * 100);
  const confidenceColor = confidence >= 0.8 ? colors.success : confidence >= 0.6 ? colors.warning : colors.error;

  return (
    <View style={[styles.countDisplay, { backgroundColor: colors.surface }]}>
      <Text style={[styles.countLabel, { color: colors.muted }]}>
        TOTAL NO CURRAL
      </Text>
      
      <View style={styles.countRow}>
        <Ionicons name="analytics" size={40} color={colors.primary} />
        <Text style={[styles.countValue, { color: colors.foreground }]}>
          {count}
        </Text>
        <Text style={[styles.countUnit, { color: colors.muted }]}>
          cabeças
        </Text>
      </View>
      
      <View style={styles.confidenceRow}>
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
      
      {lastUpdate && (
        <Text style={[styles.lastUpdate, { color: colors.muted }]}>
          Última atualização: {new Date(lastUpdate).toLocaleTimeString('pt-BR')}
        </Text>
      )}
    </View>
  );
};

/**
 * Gráfico de Histórico (Simplificado)
 */
const HistoryChart: React.FC<{
  data: CountHistory[];
  colors: any;
}> = ({ data, colors }) => {
  if (data.length === 0) {
    return (
      <View style={[styles.chartContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.chartTitle, { color: colors.foreground }]}>
          Histórico de Contagem
        </Text>
        <Text style={[styles.noData, { color: colors.muted }]}>
          Sem dados disponíveis
        </Text>
      </View>
    );
  }

  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <View style={[styles.chartContainer, { backgroundColor: colors.surface }]}>
      <Text style={[styles.chartTitle, { color: colors.foreground }]}>
        Histórico de Contagem (Últimas 24h)
      </Text>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chartBars}>
          {data.map((item, index) => (
            <View key={index} style={styles.chartBarContainer}>
              <View style={styles.chartBarWrapper}>
                <View
                  style={[
                    styles.chartBar,
                    {
                      backgroundColor: colors.primary,
                      height: `${(item.count / maxCount) * 100}%`,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.chartBarLabel, { color: colors.muted }]}>
                {item.label}
              </Text>
              <Text style={[styles.chartBarValue, { color: colors.foreground }]}>
                {item.count}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

/**
 * Configurações do Curral
 */
const PenSettings: React.FC<{
  aggregationRule: string;
  onChangeRule: (rule: string) => void;
  colors: any;
}> = ({ aggregationRule, onChangeRule, colors }) => {
  const rules = [
    { id: 'median', label: 'Mediana', desc: 'Usa o valor mediano das câmeras' },
    { id: 'max', label: 'Máximo', desc: 'Usa o maior valor entre as câmeras' },
    { id: 'principal', label: 'Principal', desc: 'Usa apenas a câmera principal' },
  ];

  return (
    <View style={[styles.settingsContainer, { backgroundColor: colors.surface }]}>
      <Text style={[styles.settingsTitle, { color: colors.foreground }]}>
        Regra de Agregação
      </Text>
      
      <View style={styles.settingsOptions}>
        {rules.map(rule => (
          <TouchableOpacity
            key={rule.id}
            style={[
              styles.settingsOption,
              {
                backgroundColor: aggregationRule === rule.id ? colors.primary + '20' : 'transparent',
                borderColor: aggregationRule === rule.id ? colors.primary : colors.border,
              },
            ]}
            onPress={() => onChangeRule(rule.id)}
          >
            <Text
              style={[
                styles.settingsOptionLabel,
                { color: aggregationRule === rule.id ? colors.primary : colors.foreground },
              ]}
            >
              {rule.label}
            </Text>
            <Text style={[styles.settingsOptionDesc, { color: colors.muted }]}>
              {rule.desc}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// ============================================================================
// TELA PRINCIPAL
// ============================================================================

export default function CurralScreen() {
  const colors = useColors();
  
  // Estados
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cameras, setCameras] = useState<CameraStatus[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<number | null>(null);
  const [penCount, setPenCount] = useState<PenCount | null>(null);
  const [history, setHistory] = useState<CountHistory[]>([]);
  const [aggregationRule, setAggregationRule] = useState('median');
  const [showSettings, setShowSettings] = useState(false);
  
  // Carregar dados
  const loadData = useCallback(async () => {
    try {
      // Simular dados para demonstração
      // Em produção, usar API real
      
      const mockCameras: CameraStatus[] = [
        { id: 1, name: 'Câmera Curral NE', status: 'online', lastSeenAt: new Date().toISOString(), position: 'NE', count: 45, confidence: 0.92 },
        { id: 2, name: 'Câmera Curral NW', status: 'online', lastSeenAt: new Date().toISOString(), position: 'NW', count: 42, confidence: 0.88 },
        { id: 3, name: 'Câmera Curral SE', status: 'online', lastSeenAt: new Date().toISOString(), position: 'SE', count: 48, confidence: 0.85 },
        { id: 4, name: 'Câmera Curral SW', status: 'offline', lastSeenAt: null, position: 'SW', count: undefined, confidence: undefined },
      ];
      
      setCameras(mockCameras);
      
      // Calcular contagem agregada
      const onlineCameras = mockCameras.filter(c => c.status === 'online' && c.count !== undefined);
      const counts = onlineCameras.map(c => c.count!);
      
      let aggregatedCount = 0;
      if (counts.length > 0) {
        switch (aggregationRule) {
          case 'median':
            counts.sort((a, b) => a - b);
            aggregatedCount = counts[Math.floor(counts.length / 2)];
            break;
          case 'max':
            aggregatedCount = Math.max(...counts);
            break;
          case 'principal':
            aggregatedCount = counts[0] || 0;
            break;
        }
      }
      
      setPenCount({
        penId: 1,
        count: aggregatedCount,
        confidence: onlineCameras.reduce((acc, c) => acc + (c.confidence || 0), 0) / onlineCameras.length,
        capturedAt: new Date().toISOString(),
        cameras: onlineCameras.map(c => ({
          cameraId: c.id,
          count: c.count!,
          confidence: c.confidence!,
        })),
      });
      
      // Histórico simulado
      const mockHistory: CountHistory[] = [];
      for (let i = 23; i >= 0; i--) {
        mockHistory.push({
          label: `${i}h`,
          count: Math.floor(40 + Math.random() * 15),
        });
      }
      setHistory(mockHistory);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [aggregationRule]);
  
  // Carregar dados iniciais
  useEffect(() => {
    loadData();
    
    // Atualizar a cada 5 segundos
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);
  
  // Handlers
  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };
  
  const handleCameraPress = (cameraId: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedCamera(selectedCamera === cameraId ? null : cameraId);
  };
  
  const handleSettingsPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowSettings(!showSettings);
  };
  
  const handleChangeRule = (rule: string) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setAggregationRule(rule);
  };
  
  // Render
  if (loading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.muted }]}>
          Conectando às câmeras...
        </Text>
      </ScreenContainer>
    );
  }
  
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
              Curral ao Vivo
            </Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Contagem em tempo real
            </Text>
          </View>
          
          <TouchableOpacity
            style={[styles.settingsButton, { backgroundColor: colors.surface }]}
            onPress={handleSettingsPress}
          >
            <Ionicons
              name={showSettings ? 'close' : 'settings-outline'}
              size={24}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>
        
        {/* Configurações */}
        {showSettings && (
          <PenSettings
            aggregationRule={aggregationRule}
            onChangeRule={handleChangeRule}
            colors={colors}
          />
        )}
        
        {/* Display Principal */}
        {penCount && (
          <CountDisplay
            count={penCount.count}
            confidence={penCount.confidence}
            lastUpdate={penCount.capturedAt}
            colors={colors}
          />
        )}
        
        {/* Grid de Câmeras */}
        <View style={styles.camerasSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Câmeras ({cameras.filter(c => c.status === 'online').length}/{cameras.length} online)
          </Text>
          
          <View style={styles.camerasGrid}>
            {cameras.map(camera => (
              <CameraCard
                key={camera.id}
                camera={camera}
                isSelected={selectedCamera === camera.id}
                onPress={() => handleCameraPress(camera.id)}
                colors={colors}
              />
            ))}
          </View>
        </View>
        
        {/* Histórico */}
        <HistoryChart data={history} colors={colors} />
        
        {/* Info */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.muted }]}>
            A contagem é atualizada automaticamente a cada 5 segundos usando visão computacional com IA.
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  settingsButton: {
    padding: 10,
    borderRadius: 12,
  },
  
  // Count Display
  countDisplay: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  countLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 8,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  countValue: {
    fontSize: 64,
    fontWeight: 'bold',
  },
  countUnit: {
    fontSize: 18,
  },
  confidenceRow: {
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
  lastUpdate: {
    fontSize: 11,
    marginTop: 12,
  },
  
  // Cameras
  camerasSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  camerasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cameraCard: {
    width: (SCREEN_WIDTH - 44) / 2,
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
  },
  cameraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cameraPosition: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  cameraBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cameraCount: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  cameraName: {
    fontSize: 11,
  },
  
  // Chart
  chartContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  noData: {
    textAlign: 'center',
    paddingVertical: 20,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    gap: 8,
  },
  chartBarContainer: {
    alignItems: 'center',
    width: 30,
  },
  chartBarWrapper: {
    height: 80,
    width: 20,
    justifyContent: 'flex-end',
  },
  chartBar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 4,
  },
  chartBarLabel: {
    fontSize: 9,
    marginTop: 4,
  },
  chartBarValue: {
    fontSize: 10,
    fontWeight: '600',
  },
  
  // Settings
  settingsContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  settingsOptions: {
    gap: 8,
  },
  settingsOption: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  settingsOptionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  settingsOptionDesc: {
    fontSize: 12,
    marginTop: 2,
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
});
