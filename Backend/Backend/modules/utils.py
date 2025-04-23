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

def tokenizar(texto, manejar_negacion=False):
    """
    Tokeniza un texto separándolo por espacios y eliminando tokens muy cortos.
    
    Args:
        texto (str): Texto a tokenizar
        
    Returns:
        list: Lista de tokens
    """
    negadores = set(["no", "nunca", "jamas", "sin"])
    texto = texto.lower()
    texto = ''.join(c if c.isalnum() or c.isspace() else ' ' for c in texto)
    tokens = texto.split()
    if manejar_negacion:
        nuevos_tokens = []
        negacion_activa = False
        for i, token in enumerate(tokens):
            if token in negadores:
                negacion_activa = True
                nuevos_tokens.append(token)
            elif negacion_activa and i < len(tokens) - 1:
                nuevos_tokens.append(f"NEG_{tokens[i+1]}")
                negacion_activa = False
            else:
                nuevos_tokens.append(token)
        return nuevos_tokens
    else:
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