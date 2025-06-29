import React, { useState, useEffect } from 'react'
import { User } from '../../types'
import { userService } from '../../services/userService'

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  onCustomerFound: (customer: User | null) => void
}

export const PhoneInput: React.FC<PhoneInputProps> = ({ value, onChange, onCustomerFound }) => {
  const [displayValue, setDisplayValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [validationMessage, setValidationMessage] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    const cleaned = input.replace(/\D/g, '')
    
    if (cleaned.length <= 11) {
      const formatted = userService.formatPhone(cleaned)
      setDisplayValue(formatted)
      onChange(cleaned)
    }
  }

  const validateUser = async (phone: string) => {
    if (phone.length === 11) {
      setLoading(true)
      setValidationMessage('')
      
      try {
        const user = await userService.findUserByPhone(phone)
        
        if (user) {
          const isEligible = await userService.validateUserDiscount(user)
          if (isEligible) {
            onCustomerFound(user)
            setValidationMessage(`Cliente encontrado: ${user.name} (${user.type})`)
          } else {
            onCustomerFound(null)
            setValidationMessage('Cliente encontrado mas não elegível para desconto')
          }
        } else {
          onCustomerFound(null)
          setValidationMessage('Cliente não encontrado no sistema')
        }
      } catch (error) {
        console.error('Error validating user:', error)
        setValidationMessage('Erro ao validar cliente')
        onCustomerFound(null)
      } finally {
        setLoading(false)
      }
    } else if (phone.length > 0) {
      onCustomerFound(null)
      setValidationMessage('')
    } else {
      onCustomerFound(null)
      setValidationMessage('')
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      validateUser(value)
    }, 500) // Debounce validation

    return () => clearTimeout(timeoutId)
  }, [value])

  const isValid = userService.validatePhoneFormat(value)
  const showValidation = value.length > 0

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Telefone (opcional)
      </label>
      <div className="relative">
        <input
          type="tel"
          value={displayValue}
          onChange={handleChange}
          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-colors ${
            showValidation
              ? isValid && validationMessage.includes('encontrado:')
                ? 'border-green-300 focus:ring-green-500 bg-green-50'
                : isValid
                ? 'border-yellow-300 focus:ring-yellow-500 bg-yellow-50'
                : 'border-red-300 focus:ring-red-500 bg-red-50'
              : 'border-gray-300 focus:ring-blue-500'
          }`}
          placeholder="(00) 00000-0000"
          maxLength={15}
        />
        
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>
      
      {showValidation && validationMessage && (
        <p className={`text-sm mt-2 ${
          validationMessage.includes('encontrado:')
            ? 'text-green-600'
            : validationMessage.includes('não encontrado') || validationMessage.includes('não elegível')
            ? 'text-yellow-600'
            : 'text-red-600'
        }`}>
          {validationMessage}
        </p>
      )}
      
      {showValidation && !isValid && value.length > 0 && (
        <p className="text-red-600 text-sm mt-1">
          Formato inválido. Use: (00) 00000-0000
        </p>
      )}
    </div>
  )
}