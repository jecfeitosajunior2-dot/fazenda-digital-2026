#!/usr/bin/env python3
"""
Vision Agent - Fazenda Digital
==============================

Serviço de visão computacional para:
1. Contagem de gado no curral em tempo real (4 câmeras RTSP/ONVIF)
2. Estimativa de peso por câmera no corredor

Requisitos:
- Python 3.9+
- OpenCV 4.x
- Ultralytics YOLOv8
- NumPy
- Requests

Autor: Fazenda Digital
Versão: 4.0.0
"""

import os
import sys
import time
import json
import logging
import threading
import queue
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, field
from enum import Enum

import cv2
import numpy as np
import requests

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('vision_agent.log')
    ]
)
logger = logging.getLogger('VisionAgent')

# ============================================================================
# CONFIGURAÇÕES
# ============================================================================

@dataclass
class Config:
    """Configurações do Vision Agent"""
    # API Backend
    api_base_url: str = os.getenv('API_BASE_URL', 'http://localhost:3000')
    api_key: str = os.getenv('VISION_AGENT_API_KEY', 'dev-vision-key')
    
    # Câmeras
    camera_reconnect_interval: int = 30  # segundos
    frame_skip: int = 5  # processar 1 a cada N frames
    
    # Detecção
    detection_confidence: float = 0.5
    detection_model: str = 'yolov8n.pt'  # Modelo YOLO
    
    # Contagem
    count_interval: float = 2.0  # segundos entre contagens
    count_smoothing_window: int = 5  # média móvel
    
    # Peso
    weight_trigger_cooldown: float = 3.0  # segundos entre estimativas
    
    # Performance
    max_workers: int = 8
    queue_size: int = 100


config = Config()


# ============================================================================
# ENUMS E TIPOS
# ============================================================================

class CameraType(Enum):
    RTSP = "rtsp"
    ONVIF = "onvif"
    RGB = "rgb"
    DEPTH = "depth"


class CameraStatus(Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    ERROR = "error"
    CONNECTING = "connecting"


@dataclass
class Detection:
    """Representa uma detecção de animal"""
    id: str
    bbox: Tuple[int, int, int, int]  # x1, y1, x2, y2
    confidence: float
    class_id: int = 0  # 0 = cattle
    
    @property
    def center(self) -> Tuple[int, int]:
        x1, y1, x2, y2 = self.bbox
        return ((x1 + x2) // 2, (y1 + y2) // 2)
    
    @property
    def area(self) -> int:
        x1, y1, x2, y2 = self.bbox
        return (x2 - x1) * (y2 - y1)


@dataclass
class CameraConfig:
    """Configuração de uma câmera"""
    id: int
    name: str
    rtsp_url: str
    type: CameraType
    position: Optional[str] = None
    pen_id: Optional[int] = None
    weigh_station_id: Optional[int] = None
    roi_config: Optional[Dict] = None


@dataclass
class PenConfig:
    """Configuração de um curral"""
    id: int
    name: str
    aggregation_rule: str = "median"
    primary_camera_id: Optional[int] = None
    camera_ids: List[int] = field(default_factory=list)


@dataclass
class WeighStationConfig:
    """Configuração de uma estação de pesagem"""
    id: int
    name: str
    camera_id: int
    camera_type: str = "rgb"
    calibration_version: int = 1
    config: Optional[Dict] = None


# ============================================================================
# DETECTOR DE GADO (YOLO)
# ============================================================================

class CattleDetector:
    """
    Detector de gado usando YOLOv8
    
    Pode ser substituído por modelo customizado treinado especificamente
    para detecção de gado (Nelore, Angus, etc.)
    """
    
    def __init__(self, model_path: str = None):
        self.model = None
        self.model_path = model_path or config.detection_model
        self._load_model()
    
    def _load_model(self):
        """Carrega o modelo YOLO"""
        try:
            from ultralytics import YOLO
            self.model = YOLO(self.model_path)
            logger.info(f"Modelo YOLO carregado: {self.model_path}")
        except ImportError:
            logger.warning("Ultralytics não instalado. Usando detector simulado.")
            self.model = None
        except Exception as e:
            logger.error(f"Erro ao carregar modelo YOLO: {e}")
            self.model = None
    
    def detect(self, frame: np.ndarray, roi_mask: Optional[np.ndarray] = None) -> List[Detection]:
        """
        Detecta gado no frame
        
        Args:
            frame: Imagem BGR do OpenCV
            roi_mask: Máscara opcional de região de interesse
            
        Returns:
            Lista de detecções
        """
        if self.model is None:
            return self._simulate_detection(frame)
        
        try:
            # Executar inferência
            results = self.model(frame, conf=config.detection_confidence, verbose=False)
            
            detections = []
            for r in results:
                boxes = r.boxes
                for i, box in enumerate(boxes):
                    # Filtrar apenas classes relevantes (cow, cattle, etc.)
                    cls = int(box.cls[0])
                    # COCO: 19 = cow, 20 = elephant, 21 = bear, etc.
                    # Para modelo customizado, ajustar conforme necessário
                    if cls in [19, 20, 21, 22, 23]:  # Animais grandes
                        x1, y1, x2, y2 = map(int, box.xyxy[0])
                        conf = float(box.conf[0])
                        
                        # Verificar se está dentro do ROI
                        if roi_mask is not None:
                            cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
                            if roi_mask[cy, cx] == 0:
                                continue
                        
                        detections.append(Detection(
                            id=f"det_{i}_{int(time.time()*1000)}",
                            bbox=(x1, y1, x2, y2),
                            confidence=conf,
                            class_id=cls
                        ))
            
            return detections
            
        except Exception as e:
            logger.error(f"Erro na detecção: {e}")
            return []
    
    def _simulate_detection(self, frame: np.ndarray) -> List[Detection]:
        """
        Simula detecções para testes quando o modelo não está disponível
        """
        import random
        
        h, w = frame.shape[:2]
        num_detections = random.randint(5, 25)
        
        detections = []
        for i in range(num_detections):
            # Gerar bounding box aleatório
            bw = random.randint(50, 150)
            bh = random.randint(40, 120)
            x1 = random.randint(0, w - bw)
            y1 = random.randint(0, h - bh)
            
            detections.append(Detection(
                id=f"sim_{i}_{int(time.time()*1000)}",
                bbox=(x1, y1, x1 + bw, y1 + bh),
                confidence=random.uniform(0.6, 0.95),
                class_id=19
            ))
        
        return detections


# ============================================================================
# ESTIMADOR DE PESO
# ============================================================================

class WeightEstimator:
    """
    Estimador de peso baseado em dimensões do animal
    
    Usa regressão linear/polinomial calibrada com pesos reais
    """
    
    def __init__(self):
        self.calibrations: Dict[int, Dict] = {}  # station_id -> calibration params
    
    def load_calibration(self, station_id: int, params: Dict):
        """Carrega parâmetros de calibração para uma estação"""
        self.calibrations[station_id] = params
        logger.info(f"Calibração carregada para estação {station_id}")
    
    def estimate(
        self,
        station_id: int,
        detection: Detection,
        frame: np.ndarray,
        depth_frame: Optional[np.ndarray] = None,
        scale_reference: Optional[float] = None
    ) -> Tuple[float, float]:
        """
        Estima o peso do animal
        
        Args:
            station_id: ID da estação de pesagem
            detection: Detecção do animal
            frame: Frame RGB
            depth_frame: Frame de profundidade (se disponível)
            scale_reference: Pixels por metro (para câmera RGB)
            
        Returns:
            Tuple (peso_estimado_kg, confiança)
        """
        calibration = self.calibrations.get(station_id)
        if not calibration:
            logger.warning(f"Sem calibração para estação {station_id}")
            return self._estimate_fallback(detection)
        
        try:
            # Extrair medições do animal
            measurements = self._extract_measurements(
                detection, frame, depth_frame, scale_reference
            )
            
            # Aplicar modelo de regressão
            coefficients = calibration.get('coefficients', [1.0, 0.0])
            model_type = calibration.get('modelType', 'linear')
            
            if model_type == 'linear':
                # y = ax + b
                weight = coefficients[0] * measurements[0] + coefficients[1]
            elif model_type == 'polynomial':
                # y = a0 + a1*x + a2*x^2 + ...
                weight = sum(c * (measurements[0] ** i) for i, c in enumerate(coefficients))
            else:
                weight = self._estimate_fallback(detection)[0]
            
            # Calcular confiança baseada na qualidade da medição
            confidence = min(0.95, detection.confidence * 0.9)
            
            return max(100, min(1500, weight)), confidence
            
        except Exception as e:
            logger.error(f"Erro na estimativa de peso: {e}")
            return self._estimate_fallback(detection)
    
    def _extract_measurements(
        self,
        detection: Detection,
        frame: np.ndarray,
        depth_frame: Optional[np.ndarray],
        scale_reference: Optional[float]
    ) -> List[float]:
        """
        Extrai medições do animal para estimativa de peso
        
        Para câmera RGB: usa proporções do bounding box
        Para câmera depth: usa dimensões reais em metros
        """
        x1, y1, x2, y2 = detection.bbox
        width_px = x2 - x1
        height_px = y2 - y1
        
        if depth_frame is not None:
            # Usar profundidade para calcular dimensões reais
            roi_depth = depth_frame[y1:y2, x1:x2]
            avg_depth = np.median(roi_depth[roi_depth > 0])
            
            # Converter para metros (assumindo câmera calibrada)
            # Fórmula simplificada: tamanho_real = tamanho_px * profundidade / focal_length
            focal_length = 500  # Ajustar conforme câmera
            width_m = width_px * avg_depth / focal_length
            height_m = height_px * avg_depth / focal_length
            
            # Estimar volume aproximado (elipsoide)
            volume = (4/3) * 3.14159 * (width_m/2) * (height_m/2) * (width_m/3)
            
            return [volume, width_m, height_m, avg_depth]
        
        elif scale_reference:
            # Usar referência de escala para RGB
            width_m = width_px / scale_reference
            height_m = height_px / scale_reference
            
            # Estimar área lateral
            area = width_m * height_m
            
            return [area, width_m, height_m]
        
        else:
            # Fallback: usar apenas proporções do bounding box
            area_px = width_px * height_px
            aspect_ratio = width_px / max(height_px, 1)
            
            return [area_px, aspect_ratio, width_px, height_px]
    
    def _estimate_fallback(self, detection: Detection) -> Tuple[float, float]:
        """
        Estimativa de fallback baseada apenas no tamanho do bounding box
        """
        area = detection.area
        
        # Fórmula empírica simplificada
        # Ajustar coeficientes com dados reais
        weight = 200 + (area / 1000) * 2.5
        weight = max(150, min(800, weight))
        
        return weight, 0.5


# ============================================================================
# PROCESSADOR DE CÂMERA
# ============================================================================

class CameraProcessor:
    """
    Processa stream de uma câmera individual
    """
    
    def __init__(
        self,
        camera_config: CameraConfig,
        detector: CattleDetector,
        weight_estimator: WeightEstimator,
        result_queue: queue.Queue
    ):
        self.config = camera_config
        self.detector = detector
        self.weight_estimator = weight_estimator
        self.result_queue = result_queue
        
        self.cap: Optional[cv2.VideoCapture] = None
        self.status = CameraStatus.OFFLINE
        self.running = False
        self.thread: Optional[threading.Thread] = None
        
        # Contagem
        self.count_history: List[int] = []
        self.last_count_time = 0
        
        # Peso
        self.last_weight_time = 0
        
        # ROI
        self.roi_mask: Optional[np.ndarray] = None
        self._setup_roi()
    
    def _setup_roi(self):
        """Configura máscara de ROI se definida"""
        if self.config.roi_config and self.config.roi_config.get('enabled'):
            # Criar máscara será feito quando tivermos o tamanho do frame
            pass
    
    def connect(self) -> bool:
        """Conecta à câmera"""
        try:
            self.status = CameraStatus.CONNECTING
            logger.info(f"Conectando à câmera {self.config.name}: {self.config.rtsp_url}")
            
            self.cap = cv2.VideoCapture(self.config.rtsp_url)
            
            if not self.cap.isOpened():
                raise Exception("Não foi possível abrir o stream")
            
            # Configurar buffer mínimo para baixa latência
            self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            
            self.status = CameraStatus.ONLINE
            logger.info(f"Câmera {self.config.name} conectada com sucesso")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao conectar câmera {self.config.name}: {e}")
            self.status = CameraStatus.ERROR
            return False
    
    def disconnect(self):
        """Desconecta da câmera"""
        if self.cap:
            self.cap.release()
            self.cap = None
        self.status = CameraStatus.OFFLINE
    
    def start(self):
        """Inicia processamento em thread separada"""
        if self.running:
            return
        
        self.running = True
        self.thread = threading.Thread(target=self._process_loop, daemon=True)
        self.thread.start()
    
    def stop(self):
        """Para o processamento"""
        self.running = False
        if self.thread:
            self.thread.join(timeout=5)
        self.disconnect()
    
    def _process_loop(self):
        """Loop principal de processamento"""
        frame_count = 0
        reconnect_attempts = 0
        
        while self.running:
            try:
                # Reconectar se necessário
                if self.status != CameraStatus.ONLINE:
                    if not self.connect():
                        reconnect_attempts += 1
                        time.sleep(min(30, 5 * reconnect_attempts))
                        continue
                    reconnect_attempts = 0
                
                # Capturar frame
                ret, frame = self.cap.read()
                if not ret:
                    logger.warning(f"Falha ao ler frame da câmera {self.config.name}")
                    self.status = CameraStatus.ERROR
                    continue
                
                frame_count += 1
                
                # Pular frames para performance
                if frame_count % config.frame_skip != 0:
                    continue
                
                # Processar frame
                self._process_frame(frame)
                
            except Exception as e:
                logger.error(f"Erro no loop de processamento: {e}")
                self.status = CameraStatus.ERROR
                time.sleep(1)
    
    def _process_frame(self, frame: np.ndarray):
        """Processa um frame individual"""
        current_time = time.time()
        
        # Criar máscara ROI se necessário
        if self.roi_mask is None and self.config.roi_config:
            self._create_roi_mask(frame.shape[:2])
        
        # Detectar animais
        detections = self.detector.detect(frame, self.roi_mask)
        
        # Processar contagem (se câmera de curral)
        if self.config.pen_id and current_time - self.last_count_time >= config.count_interval:
            self._process_count(detections, current_time)
        
        # Processar peso (se câmera de pesagem)
        if self.config.weigh_station_id and current_time - self.last_weight_time >= config.weight_trigger_cooldown:
            self._process_weight(detections, frame, current_time)
    
    def _create_roi_mask(self, shape: Tuple[int, int]):
        """Cria máscara de ROI"""
        h, w = shape
        self.roi_mask = np.zeros((h, w), dtype=np.uint8)
        
        if self.config.roi_config and self.config.roi_config.get('points'):
            points = np.array(self.config.roi_config['points'], dtype=np.int32)
            cv2.fillPoly(self.roi_mask, [points], 255)
        else:
            self.roi_mask[:] = 255  # Usar frame inteiro
    
    def _process_count(self, detections: List[Detection], current_time: float):
        """Processa contagem de animais"""
        count = len(detections)
        
        # Adicionar ao histórico para suavização
        self.count_history.append(count)
        if len(self.count_history) > config.count_smoothing_window:
            self.count_history.pop(0)
        
        # Calcular média móvel
        smoothed_count = int(np.median(self.count_history))
        
        # Calcular confiança média
        avg_confidence = np.mean([d.confidence for d in detections]) if detections else 0.0
        
        # Enviar resultado
        result = {
            'type': 'count',
            'camera_id': self.config.id,
            'pen_id': self.config.pen_id,
            'count': smoothed_count,
            'raw_count': count,
            'confidence': avg_confidence,
            'timestamp': datetime.utcnow().isoformat(),
            'detections': [
                {'id': d.id, 'bbox': d.bbox, 'confidence': d.confidence}
                for d in detections
            ]
        }
        
        self.result_queue.put(result)
        self.last_count_time = current_time
        
        logger.debug(f"Câmera {self.config.name}: {smoothed_count} animais detectados")
    
    def _process_weight(self, detections: List[Detection], frame: np.ndarray, current_time: float):
        """Processa estimativa de peso"""
        if not detections:
            return
        
        # Pegar a detecção mais central/confiante
        best_detection = max(detections, key=lambda d: d.confidence * d.area)
        
        # Verificar se está na zona de trigger
        # (implementar lógica de zona de trigger se necessário)
        
        # Estimar peso
        station_id = self.config.weigh_station_id
        weight, confidence = self.weight_estimator.estimate(
            station_id,
            best_detection,
            frame,
            depth_frame=None,  # Adicionar suporte a depth se disponível
            scale_reference=None
        )
        
        # Enviar resultado
        result = {
            'type': 'weight',
            'station_id': station_id,
            'camera_id': self.config.id,
            'estimated_kg': weight,
            'confidence': confidence,
            'timestamp': datetime.utcnow().isoformat(),
            'detection': {
                'id': best_detection.id,
                'bbox': best_detection.bbox,
                'confidence': best_detection.confidence
            }
        }
        
        self.result_queue.put(result)
        self.last_weight_time = current_time
        
        logger.info(f"Peso estimado: {weight:.1f}kg (confiança: {confidence:.2f})")


# ============================================================================
# API CLIENT
# ============================================================================

class APIClient:
    """Cliente para comunicação com o backend"""
    
    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.session = requests.Session()
    
    def send_count(self, pen_id: int, camera_id: int, count: int, confidence: float, timestamp: str, meta: Dict = None):
        """Envia contagem para o backend"""
        try:
            payload = {
                'type': 'count',
                'apiKey': self.api_key,
                'data': {
                    'penId': pen_id,
                    'cameraId': camera_id,
                    'count': count,
                    'confidence': confidence,
                    'capturedAt': timestamp,
                    'meta': meta
                }
            }
            
            response = self.session.post(
                f"{self.base_url}/api/trpc/vision.ingest",
                json=payload,
                timeout=5
            )
            
            if response.status_code == 200:
                logger.debug(f"Contagem enviada: pen={pen_id}, count={count}")
            else:
                logger.warning(f"Erro ao enviar contagem: {response.status_code}")
                
        except Exception as e:
            logger.error(f"Erro ao enviar contagem: {e}")
    
    def send_weight(self, station_id: int, weight: float, confidence: float, calibration_version: int, timestamp: str, meta: Dict = None):
        """Envia estimativa de peso para o backend"""
        try:
            payload = {
                'type': 'weight',
                'apiKey': self.api_key,
                'data': {
                    'stationId': station_id,
                    'estimatedKg': weight,
                    'confidence': confidence,
                    'calibrationVersion': calibration_version,
                    'capturedAt': timestamp,
                    'meta': meta
                }
            }
            
            response = self.session.post(
                f"{self.base_url}/api/trpc/vision.ingest",
                json=payload,
                timeout=5
            )
            
            if response.status_code == 200:
                logger.debug(f"Peso enviado: station={station_id}, weight={weight}kg")
            else:
                logger.warning(f"Erro ao enviar peso: {response.status_code}")
                
        except Exception as e:
            logger.error(f"Erro ao enviar peso: {e}")
    
    def fetch_cameras(self) -> List[Dict]:
        """Busca configurações das câmeras do backend"""
        try:
            response = self.session.get(
                f"{self.base_url}/api/trpc/vision.getCamerasStatus",
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get('result', {}).get('data', {}).get('data', [])
            
        except Exception as e:
            logger.error(f"Erro ao buscar câmeras: {e}")
        
        return []
    
    def fetch_calibration(self, station_id: int) -> Optional[Dict]:
        """Busca calibração de uma estação"""
        # Implementar quando necessário
        return None


# ============================================================================
# VISION AGENT (ORQUESTRADOR)
# ============================================================================

class VisionAgent:
    """
    Orquestrador principal do Vision Agent
    
    Gerencia múltiplas câmeras e envia resultados para o backend
    """
    
    def __init__(self):
        self.detector = CattleDetector()
        self.weight_estimator = WeightEstimator()
        self.api_client = APIClient(config.api_base_url, config.api_key)
        
        self.result_queue = queue.Queue(maxsize=config.queue_size)
        self.processors: Dict[int, CameraProcessor] = {}
        
        self.running = False
        self.sender_thread: Optional[threading.Thread] = None
    
    def add_camera(self, camera_config: CameraConfig):
        """Adiciona uma câmera para processamento"""
        if camera_config.id in self.processors:
            logger.warning(f"Câmera {camera_config.id} já existe")
            return
        
        processor = CameraProcessor(
            camera_config,
            self.detector,
            self.weight_estimator,
            self.result_queue
        )
        
        self.processors[camera_config.id] = processor
        logger.info(f"Câmera {camera_config.name} adicionada")
    
    def remove_camera(self, camera_id: int):
        """Remove uma câmera"""
        if camera_id in self.processors:
            self.processors[camera_id].stop()
            del self.processors[camera_id]
            logger.info(f"Câmera {camera_id} removida")
    
    def start(self):
        """Inicia o Vision Agent"""
        if self.running:
            return
        
        logger.info("Iniciando Vision Agent...")
        self.running = True
        
        # Iniciar thread de envio de resultados
        self.sender_thread = threading.Thread(target=self._sender_loop, daemon=True)
        self.sender_thread.start()
        
        # Iniciar processadores de câmera
        for processor in self.processors.values():
            processor.start()
        
        logger.info(f"Vision Agent iniciado com {len(self.processors)} câmeras")
    
    def stop(self):
        """Para o Vision Agent"""
        logger.info("Parando Vision Agent...")
        self.running = False
        
        # Parar processadores
        for processor in self.processors.values():
            processor.stop()
        
        # Aguardar thread de envio
        if self.sender_thread:
            self.sender_thread.join(timeout=5)
        
        logger.info("Vision Agent parado")
    
    def _sender_loop(self):
        """Loop de envio de resultados para o backend"""
        while self.running:
            try:
                # Aguardar resultado com timeout
                try:
                    result = self.result_queue.get(timeout=1)
                except queue.Empty:
                    continue
                
                # Enviar para backend
                if result['type'] == 'count':
                    self.api_client.send_count(
                        pen_id=result['pen_id'],
                        camera_id=result['camera_id'],
                        count=result['count'],
                        confidence=result['confidence'],
                        timestamp=result['timestamp'],
                        meta={
                            'raw_count': result.get('raw_count'),
                            'detections': result.get('detections')
                        }
                    )
                
                elif result['type'] == 'weight':
                    self.api_client.send_weight(
                        station_id=result['station_id'],
                        weight=result['estimated_kg'],
                        confidence=result['confidence'],
                        calibration_version=1,  # TODO: buscar versão atual
                        timestamp=result['timestamp'],
                        meta={
                            'detection': result.get('detection')
                        }
                    )
                
            except Exception as e:
                logger.error(f"Erro no loop de envio: {e}")
    
    def load_cameras_from_api(self):
        """Carrega configurações de câmeras do backend"""
        cameras = self.api_client.fetch_cameras()
        
        for cam in cameras:
            if cam.get('status') == 'offline':
                continue
            
            camera_config = CameraConfig(
                id=cam['id'],
                name=cam['name'],
                rtsp_url=cam.get('rtspUrl', ''),
                type=CameraType(cam.get('type', 'rtsp')),
                position=cam.get('position'),
                pen_id=cam.get('penId'),
                weigh_station_id=cam.get('weighStationId'),
                roi_config=cam.get('roiConfig')
            )
            
            self.add_camera(camera_config)
        
        logger.info(f"Carregadas {len(cameras)} câmeras do backend")


# ============================================================================
# MAIN
# ============================================================================

def main():
    """Função principal"""
    logger.info("=" * 60)
    logger.info("FAZENDA DIGITAL - VISION AGENT v4.0.0")
    logger.info("=" * 60)
    
    # Criar agente
    agent = VisionAgent()
    
    # Modo de demonstração: adicionar câmeras de teste
    if os.getenv('DEMO_MODE', 'false').lower() == 'true':
        logger.info("Modo de demonstração ativado")
        
        # Câmeras de curral (simuladas)
        for i, pos in enumerate(['NE', 'NW', 'SE', 'SW']):
            agent.add_camera(CameraConfig(
                id=i + 1,
                name=f"Câmera Curral {pos}",
                rtsp_url=f"rtsp://demo/curral_{pos}",  # URL simulada
                type=CameraType.RTSP,
                position=pos,
                pen_id=1
            ))
        
        # Câmera de pesagem (simulada)
        agent.add_camera(CameraConfig(
            id=5,
            name="Câmera Corredor Pesagem",
            rtsp_url="rtsp://demo/pesagem",
            type=CameraType.RGB,
            weigh_station_id=1
        ))
    
    else:
        # Carregar câmeras do backend
        agent.load_cameras_from_api()
    
    # Iniciar agente
    agent.start()
    
    # Manter rodando
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        logger.info("Interrupção recebida")
    finally:
        agent.stop()


if __name__ == "__main__":
    main()
