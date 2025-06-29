class ImageService {
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Simular upload de imagem (em produção seria para um serviço real)
  async uploadImage(file: File, type: 'logo' | 'product'): Promise<string> {
    await this.delay(1500) // Simular tempo de upload

    // Validar arquivo
    if (!file.type.startsWith('image/')) {
      throw new Error('Arquivo deve ser uma imagem')
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Arquivo deve ter no máximo 5MB')
    }

    // Simular upload e retornar URL
    const reader = new FileReader()
    
    return new Promise((resolve, reject) => {
      reader.onload = (e) => {
        const result = e.target?.result as string
        
        // Salvar no localStorage para demonstração
        const imageKey = `uploaded_${type}_${Date.now()}`
        localStorage.setItem(imageKey, result)
        
        resolve(result)
      }
      
      reader.onerror = () => {
        reject(new Error('Erro ao processar imagem'))
      }
      
      reader.readAsDataURL(file)
    })
  }

  // Validar URL de imagem
  async validateImageUrl(url: string): Promise<boolean> {
    if (!url) return false
    
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => resolve(true)
      img.onerror = () => resolve(false)
      img.src = url
      
      // Timeout de 5 segundos
      setTimeout(() => resolve(false), 5000)
    })
  }

  // Redimensionar imagem para otimização
  async resizeImage(file: File, maxWidth: number, maxHeight: number, quality: number = 0.8): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()
      
      img.onload = () => {
        // Calcular novas dimensões mantendo proporção
        let { width, height } = img
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        // Desenhar imagem redimensionada
        ctx.drawImage(img, 0, 0, width, height)
        
        // Converter para blob
        canvas.toBlob((blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            })
            resolve(resizedFile)
          } else {
            resolve(file)
          }
        }, file.type, quality)
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  // Obter dimensões da imagem
  async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      
      img.onload = () => {
        resolve({ width: img.width, height: img.height })
        URL.revokeObjectURL(img.src)
      }
      
      img.onerror = () => {
        reject(new Error('Erro ao carregar imagem'))
        URL.revokeObjectURL(img.src)
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  // Formatos de imagem aceitos
  getAcceptedFormats(): string {
    return 'image/jpeg,image/jpg,image/png,image/webp,image/gif'
  }

  // Tamanho máximo em bytes
  getMaxFileSize(): number {
    return 5 * 1024 * 1024 // 5MB
  }

  // Formatar tamanho do arquivo
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}

export const imageService = new ImageService()