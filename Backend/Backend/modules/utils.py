import re

def limpiar_texto(texto):
    """
    Limpia el texto eliminando menciones, hashtags, URLs y signos de puntuación,
    manteniendo las letras con tilde y ñ.
    
    Args:
        texto (str): Texto a limpiar
        
    Returns:
        str: Texto limpio
    """
    # Quitar menciones
    texto = re.sub(r'@\w+', '', texto)
    # Quitar hashtags (solo el símbolo #, no la palabra)
    texto = re.sub(r'#', '', texto)
    # Quitar URLs
    texto = re.sub(r'https?:\/\/\S+', '', texto)
    # Quitar signos de puntuación, pero permitir letras con tilde y ñ
    texto = re.sub(r'[^\w\sáéíóúÁÉÍÓÚñÑ]', '', texto)
    # Quitar espacios múltiples
    texto = re.sub(r'\s+', ' ', texto).strip()
    return texto

def tokenizar(texto):
    """
    Tokeniza un texto separándolo por espacios y eliminando tokens muy cortos.
    
    Args:
        texto (str): Texto a tokenizar
        
    Returns:
        list: Lista de tokens
    """
    tokens = texto.lower().split()
    tokens = [palabra for palabra in tokens if len(palabra) > 2]
    return tokens

def obtener_ngramas(tokens, n=2):
    """
    Genera n-gramas a partir de tokens.
    
    Args:
        tokens (list): Lista de tokens
        n (int): Tamaño del n-grama
        
    Returns:
        list: Lista de n-gramas
    """
    return [' '.join(tokens[i:i+n]) for i in range(len(tokens)-n+1)]