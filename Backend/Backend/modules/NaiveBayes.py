import pickle
from math import log
from collections import defaultdict, Counter
import sys
import os

modulesPath = os.path.dirname(os.path.abspath(__file__))
sys.path.append(modulesPath)

import utils

class NaiveBayesClassifier:
    """
    Implementación de un clasificador Naive Bayes para análisis de sentimientos.
    """
    
    def __init__(self, alpha=1):
        """
        Inicializa el clasificador con el factor de suavizado de Laplace.
        
        Args:
            alpha (float): Factor de suavizado de Laplace (por defecto 1).
        """
        self.alpha = alpha
        self.frecuencia_palabras_por_clase = None
        self.total_palabras_por_clase = None
        self.documentos_por_clase = None
        self.vocabulario = None
        self.log_probabilidades_previas = None
        self.tablas_condicionales = None
        self.tam_vocabulario = 0
    
    def procesar_documentos(self, X_train, y_train, usar_bigramas=True):
        """
        Procesa los documentos de entrenamiento para generar las estructuras necesarias.
        
        Args:
            X_train (list): Lista de textos de entrenamiento.
            y_train (list): Lista de etiquetas de entrenamiento.
            usar_bigramas (bool): Indica si se deben incluir bigramas (por defecto True).
            
        Returns:
            tuple: Estructuras de datos generadas.
        """
        print("Procesando documentos de entrenamiento...")
        
        # Inicializar estructuras
        self.frecuencia_palabras_por_clase = defaultdict(Counter)
        self.total_palabras_por_clase = defaultdict(int)
        self.documentos_por_clase = defaultdict(int)
        self.vocabulario = set()
        
        # Procesar cada documento
        for i, (texto, etiqueta) in enumerate(zip(X_train, y_train)):
            palabras = utils.tokenizar(texto)
            bigramas = utils.obtener_ngramas(palabras, 2) if usar_bigramas else []
            
            self.documentos_por_clase[etiqueta] += 1
            self.total_palabras_por_clase[etiqueta] += len(palabras)
            self.vocabulario.update(palabras)
            
            for palabra in palabras:
                self.frecuencia_palabras_por_clase[etiqueta][palabra] += 1
            
            if usar_bigramas:
                for bigrama in bigramas:
                    self.frecuencia_palabras_por_clase[etiqueta][bigrama] += 1
                    self.vocabulario.add(bigrama)
            
            # Mostrar progreso
            if (i + 1) % 5000 == 0:
                print(f"Procesados {i + 1}/{len(X_train)} documentos ({(i + 1)/len(X_train)*100:.1f}%)")
        
        self.tam_vocabulario = len(self.vocabulario)
        print(f"Procesamiento completado. Tamaño del vocabulario: {self.tam_vocabulario}")
        
        return (self.frecuencia_palabras_por_clase, 
                self.total_palabras_por_clase, 
                self.documentos_por_clase, 
                self.vocabulario)
    
    def entrenar(self):
        """
        Entrena el modelo Naive Bayes utilizando los datos procesados.
        
        Returns:
            dict: Modelo entrenado.
        """
        print("Entrenando modelo Naive Bayes...")
        
        if (self.frecuencia_palabras_por_clase is None or 
            self.total_palabras_por_clase is None or 
            self.documentos_por_clase is None or 
            self.vocabulario is None):
            raise ValueError("Es necesario procesar los documentos antes de entrenar el modelo.")
        
        total_documentos = sum(self.documentos_por_clase.values())
        
        # Calcular probabilidades previas (en log)
        self.log_probabilidades_previas = {
            clase: log(self.documentos_por_clase[clase] / total_documentos)
            for clase in self.documentos_por_clase
        }
        
        # Calcular tablas de probabilidad condicional (en log)
        self.tablas_condicionales = {}
        
        for clase, frecuencias in self.frecuencia_palabras_por_clase.items():
            total_palabras = self.total_palabras_por_clase[clase]
            tabla = {}
            for palabra in self.vocabulario:
                freq = frecuencias[palabra]
                prob = (freq + self.alpha) / (total_palabras + self.alpha * self.tam_vocabulario)
                tabla[palabra] = log(prob)
            self.tablas_condicionales[clase] = tabla
        
        print("Entrenamiento completado.")
        
        return self._obtener_modelo()
    
    def _obtener_modelo(self):
        """
        Devuelve el modelo entrenado en formato de diccionario.
        
        Returns:
            dict: Modelo entrenado.
        """
        return {
            'log_probabilidades_previas': self.log_probabilidades_previas,
            'tablas_condicionales': self.tablas_condicionales,
            'total_palabras_por_clase': self.total_palabras_por_clase,
            'tam_vocabulario': self.tam_vocabulario,
            'alpha': self.alpha
        }
    
    def guardar_modelo(self, ruta='..\\Data\\ModelData\\modelo_entrenado.pkl'):
        """
        Guarda el modelo entrenado en un archivo.
        
        Args:
            ruta (str): Ruta donde guardar el modelo.
        """
        modelo = self._obtener_modelo()
        with open(ruta, 'wb') as f:
            pickle.dump(modelo, f)
        print(f"Modelo guardado en {ruta}")
    
    def cargar_modelo(self, ruta='..\\Data\\ModelData\\modelo_entrenado.pkl'):
        """
        Carga un modelo entrenado desde un archivo.
        
        Args:
            ruta (str): Ruta del archivo del modelo.
            
        Returns:
            dict: Modelo cargado.
        """
        with open(ruta, 'rb') as f:
            modelo = pickle.load(f)
        
        self.log_probabilidades_previas = modelo['log_probabilidades_previas']
        self.tablas_condicionales = modelo['tablas_condicionales']
        self.total_palabras_por_clase = modelo['total_palabras_por_clase']
        self.tam_vocabulario = modelo['tam_vocabulario']
        self.alpha = modelo['alpha']
        
        return modelo
    
    def clasificar(self, texto):
        """
        Clasifica un texto utilizando el modelo entrenado.
        
        Args:
            texto (str): Texto a clasificar.
            
        Returns:
            int: Clase predicha.
        """
        palabras = utils.tokenizar(texto)
        puntajes = {}
        
        for clase in self.log_probabilidades_previas:
            log_prob = self.log_probabilidades_previas[clase]
            tabla_condicional = self.tablas_condicionales[clase]
            total_palabras = self.total_palabras_por_clase[clase]
            
            for palabra in palabras:
                if palabra in tabla_condicional:
                    log_prob += tabla_condicional[palabra]
                else:
                    # Suavizado de Laplace para palabras desconocidas
                    log_prob += log(self.alpha / (total_palabras + self.alpha * self.tam_vocabulario))
            
            puntajes[clase] = log_prob
        
        return max(puntajes, key=puntajes.get)

def entrenar_desde_archivos():
    """
    Entrena un modelo cargando los datos desde archivos guardados previamente.
    
    Returns:
        NaiveBayesClassifier: Clasificador entrenado.
    """
    # Cargar datos de entrenamiento
    with open('..\\Data\\TrainingData\\X_train.pkl', 'rb') as f:
        X_train = pickle.load(f)
    
    with open('..\\Data\\TrainingData\\y_train.pkl', 'rb') as f:
        y_train = pickle.load(f)
    
    # Crear y entrenar clasificador
    clasificador = NaiveBayesClassifier()
    clasificador.procesar_documentos(X_train, y_train)
    clasificador.entrenar()
    clasificador.guardar_modelo()
    
    return clasificador

def cargar_clasificador(ruta='..\\Data\\ModelData\\modelo_entrenado.pkl'):
    """
    Carga un clasificador desde un modelo guardado.
    
    Args:
        ruta (str): Ruta del archivo del modelo.
        
    Returns:
        NaiveBayesClassifier: Clasificador cargado.
    """
    clasificador = NaiveBayesClassifier()
    clasificador.cargar_modelo(ruta)
    return clasificador

def obtener_etiqueta_sentimiento(clase):
    """
    Convierte el valor numérico de la clase a su etiqueta de sentimiento.
    
    Args:
        clase (int): Valor numérico de la clase.
        
    Returns:
        str: Etiqueta de sentimiento.
    """
    mapa_sentimientos = {
        0: 'negativo',
        1: 'neutral',
        2: 'positivo'
    }
    return mapa_sentimientos.get(clase, 'desconocido')