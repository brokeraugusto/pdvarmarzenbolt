import React, { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon, AlertCircle, CheckCircle, Loader } from 'lucide-react'
import { imageService } from '../../services/imageService'

interface ImageUploadProps {
  currentImage?: string
  onImageChange: (imageUrl: string) => void
  type: 'logo' | 'product'
  label: string
  description?: string
  maxWidth?: number
  maxHeight?: number
  className?: string
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  currentImage,
  onImageChange,
  type,
  label,
  description,
  maxWidth = 800,
  maxHeight = 600,
  className = ''
}) => {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string>('')
  const [dragOver, setDragOver] = useState(false)
  const [imageUrl, setImageUrl] = useState(currentImage || '')
  const [urlMode, setUrlMode] = useState(false)
  const [validatingUrl, setValidatingUrl] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    setError('')
    setUploading(true)

    try {
      // Validar arquivo
      if (!file.type.startsWith('image/')) {
        throw new Error('Arquivo deve ser uma imagem')
      }

      if (file.size > imageService.getMaxFileSize()) {
        throw new Error(`Arquivo deve ter no máximo ${imageService.formatFileSize(imageService.getMaxFileSize())}`)
      }

      // Obter dimensões originais
      const dimensions = await imageService.getImageDimensions(file)
      
      // Redimensionar se necessário
      let processedFile = file
      if (dimensions.width > maxWidth || dimensions.height > maxHeight) {
        processedFile = await imageService.resizeImage(file, maxWidth, maxHeight, 0.9)
      }

      // Upload da imagem
      const uploadedUrl = await imageService.uploadImage(processedFile, type)
      
      onImageChange(uploadedUrl)
      setImageUrl(uploadedUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer upload da imagem')
    } finally {
      setUploading(false)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleUrlSubmit = async () => {
    if (!imageUrl.trim()) return

    setValidatingUrl(true)
    setError('')

    try {
      const isValid = await imageService.validateImageUrl(imageUrl)
      
      if (!isValid) {
        throw new Error('URL da imagem inválida ou inacessível')
      }

      onImageChange(imageUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao validar URL da imagem')
    } finally {
      setValidatingUrl(false)
    }
  }

  const handleRemoveImage = () => {
    onImageChange('')
    setImageUrl('')
    setError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const currentDisplayImage = currentImage || imageUrl

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
        {description && (
          <p className="text-sm text-gray-500 mb-3">{description}</p>
        )}
      </div>

      {/* Toggle entre Upload e URL */}
      <div className="flex space-x-4 mb-4">
        <button
          type="button"
          onClick={() => setUrlMode(false)}
          className={`px-4 py-2 text-sm rounded-lg transition-colors ${
            !urlMode
              ? 'bg-blue-100 text-blue-700 border border-blue-300'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Upload de Arquivo
        </button>
        <button
          type="button"
          onClick={() => setUrlMode(true)}
          className={`px-4 py-2 text-sm rounded-lg transition-colors ${
            urlMode
              ? 'bg-blue-100 text-blue-700 border border-blue-300'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          URL da Imagem
        </button>
      </div>

      {/* Preview da imagem atual */}
      {currentDisplayImage && (
        <div className="relative inline-block">
          <img
            src={currentDisplayImage}
            alt="Preview"
            className={`rounded-lg border border-gray-300 object-cover ${
              type === 'logo' ? 'h-24 w-24' : 'h-32 w-32'
            }`}
          />
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {urlMode ? (
        /* Modo URL */
        <div className="space-y-3">
          <div className="flex space-x-2">
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://exemplo.com/imagem.jpg"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={handleUrlSubmit}
              disabled={validatingUrl || !imageUrl.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {validatingUrl ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  <span>Validando...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Usar URL</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Modo Upload */
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragOver
              ? 'border-blue-400 bg-blue-50'
              : uploading
              ? 'border-gray-300 bg-gray-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {uploading ? (
            <div className="space-y-2">
              <Loader className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
              <p className="text-sm text-gray-600">Fazendo upload...</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="h-8 w-8 text-gray-400 mx-auto" />
              <div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clique para selecionar
                </button>
                <span className="text-gray-500"> ou arraste uma imagem aqui</span>
              </div>
              <p className="text-xs text-gray-500">
                PNG, JPG, WEBP até {imageService.formatFileSize(imageService.getMaxFileSize())}
              </p>
              {type === 'logo' && (
                <p className="text-xs text-gray-500">
                  Recomendado: 200x200px ou proporção quadrada
                </p>
              )}
              {type === 'product' && (
                <p className="text-xs text-gray-500">
                  Recomendado: 800x600px ou proporção 4:3
                </p>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={imageService.getAcceptedFormats()}
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>
      )}

      {/* Mensagem de erro */}
      {error && (
        <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Informações adicionais */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• Formatos aceitos: JPEG, PNG, WEBP, GIF</p>
        <p>• Tamanho máximo: {imageService.formatFileSize(imageService.getMaxFileSize())}</p>
        <p>• A imagem será redimensionada automaticamente se necessário</p>
      </div>
    </div>
  )
}