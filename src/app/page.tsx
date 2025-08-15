'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  CheckCircleIcon,
  PhotoIcon,
  ArrowLeftIcon,
  ArrowRightIcon
} from '@heroicons/react/24/solid';
// Removed Shadcn imports - using only Tailwind CSS

type FormData = {
  image: File | null;
  size: string;
  personalData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  specialNotes: string;
  shippingData: {
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
};

export default function CertificateForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    image: null,
    size: '',
    personalData: {
      firstName: '',
      lastName: '',
      email: '',
      phone: ''
    },
    specialNotes: '',
    shippingData: {
      address: '',
      city: '',
      postalCode: '',
      country: ''
    }
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sizeOptions = [
    { size: '5x7', label: '5×7 inches', dimensions: '12.7×17.8 cm', price: '$84.99', productId: parseInt(process.env.NEXT_PUBLIC_PRODUCT_ID_5X7 || '4842'), popular: false },
    { size: '6x6', label: '6×6 inches', dimensions: '15.2×15.2 cm', price: '$89.99', productId: parseInt(process.env.NEXT_PUBLIC_PRODUCT_ID_6X6 || '4843'), popular: true },
    { size: '6x8', label: '6×8 inches', dimensions: '15.2×20.3 cm', price: '$94.99', productId: parseInt(process.env.NEXT_PUBLIC_PRODUCT_ID_6X8 || '4844'), popular: false },
    { size: '8x8', label: '8×8 inches', dimensions: '20.3×20.3 cm', price: '$99.99', productId: parseInt(process.env.NEXT_PUBLIC_PRODUCT_ID_8X8 || '4844'), popular: false }
  ];

  const getProductInfo = (size: string) => {
    return sizeOptions.find(option => option.size === size) || sizeOptions[0];
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSizeSelect = (size: string) => {
    setFormData({ ...formData, size });
  };

  const handlePersonalDataChange = (field: string, value: string) => {
    // Validate phone field to only allow numbers, spaces, parentheses, hyphens, and plus sign
    if (field === 'phone') {
      const phoneRegex = /^[0-9\s\(\)\-\+]*$/;
      if (!phoneRegex.test(value)) {
        return; // Don't update if invalid characters
      }
    }
    
    setFormData({
      ...formData,
      personalData: { ...formData.personalData, [field]: value }
    });
  };

  const handleShippingDataChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      shippingData: { ...formData.shippingData, [field]: value }
    });
  };

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return; // Prevent multiple submissions
    
    setIsSubmitting(true);
    try {
      const productInfo = getProductInfo(formData.size);
      
      // Convert image to base64 if present
      let imageBase64 = null;
      if (formData.image) {
        const reader = new FileReader();
        imageBase64 = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(formData.image!);
        });
      }
      
      // Prepare form data for webhook
      const webhookData = {
        image: formData.image ? {
          name: formData.image.name,
          size: formData.image.size,
          type: formData.image.type,
          data: imageBase64 // Base64 encoded image data
        } : null,
        certificateSize: formData.size,
        productId: productInfo.productId,
        personalData: formData.personalData,
        specialNotes: formData.specialNotes,
        shippingData: formData.shippingData,
        orderDate: new Date().toISOString(),
        price: productInfo.price
      };

      const webhookUrl = process.env.NEXT_PUBLIC_WEBHOOK_URL;
      
      if (!webhookUrl) {
        throw new Error('Webhook URL not configured');
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData)
      });

      if (response.ok) {
        alert('Order sent successfully!');
        console.log('Order sent to webhook:', webhookData);
      } else {
        throw new Error(`Webhook request failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      alert('Error sending order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1e1e20' }}>
      <div className="px-3 sm:px-4 py-4 sm:py-8">

          {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-400">Step {currentStep} of 4</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
            <div 
              className="h-2 rounded-full transition-all duration-300 ease-in-out"
              style={{ 
                width: `${(currentStep / 4) * 100}%`,
                background: 'linear-gradient(90deg, #e4b833 0%, #f8df51 100%)'
              }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span className={currentStep >= 1 ? 'text-yellow-400 font-medium' : ''}>Upload</span>
            <span className={currentStep >= 2 ? 'text-yellow-400 font-medium' : ''}>Size</span>
            <span className={currentStep >= 3 ? 'text-yellow-400 font-medium' : ''}>Details & Shipping</span>
            <span className={currentStep >= 4 ? 'text-yellow-400 font-medium' : ''}>Review</span>
          </div>
        </div>

        {/* Loading Warning */}
        {isSubmitting && (
          <div className="mb-6 p-4 bg-yellow-900/30 border border-yellow-500/50 rounded-xl backdrop-blur-sm">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-400"></div>
              <div>
                <p className="text-yellow-300 font-semibold">Sending your order...</p>
                <p className="text-yellow-200 text-sm">Please do not reload the page or close this window.</p>
              </div>
            </div>
          </div>
        )}

        {/* Form Content */}
        <div className="border border-yellow-600/40 rounded-xl sm:rounded-2xl shadow-2xl mx-auto backdrop-blur-md ring-1 ring-yellow-600/20" style={{backgroundColor: '#131313'}}>
          <div className="p-4 sm:p-6 lg:p-8">



            {/* Step 1: Upload Image */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-6 sm:mb-8">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2 sm:mb-3 tracking-tight">Upload Your Image</h2>
                  <p className="text-gray-400 text-sm sm:text-base lg:text-lg leading-relaxed px-2">Choose the image you want to transform into a certificate</p>
                </div>
                <div className="max-w-2xl mx-auto px-2 sm:px-0">
                  {imagePreview ? (
                    <div className="space-y-4">
                      <div className="border rounded-lg p-3 sm:p-4 bg-muted/50 max-w-xs sm:max-w-md mx-auto">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-auto rounded-md max-h-48 sm:max-h-64 object-contain"
                        />
                      </div>
                      <div className="flex items-center justify-center space-x-2 text-green-600">
                        <CheckCircleIcon className="w-5 h-5" />
                        <p className="font-medium">Image uploaded successfully!</p>
                      </div>
                      <div className="text-center">
                        <label className="inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors cursor-pointer text-sm sm:text-base">
                          Choose Different Image
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 sm:p-6 lg:p-8 text-center hover:border-gray-500 transition-colors">
                      <PhotoIcon className="w-8 sm:w-10 lg:w-12 h-8 sm:h-10 lg:h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-300 mb-2 text-sm sm:text-base px-2">Drag and drop your image here, or click to browse</p>
                      <p className="text-xs sm:text-sm text-yellow-400 mb-4 sm:mb-6">Supports JPG, PNG, WebP up to 10MB</p>
                      <label htmlFor="image-upload" className="inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 text-black rounded-lg font-semibold transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base" style={{ background: 'linear-gradient(135deg, #e4b833 0%, #f8df51 100%)' }}>
                        Choose File
                        <input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Choose Size */}
            {currentStep === 2 && (
              <div className="space-y-4 sm:space-y-6">
                <div className="text-center mb-6 sm:mb-8">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2 sm:mb-3 tracking-tight">Choose Your Size</h2>
                  <p className="text-gray-400 text-sm sm:text-base lg:text-lg leading-relaxed px-2">Select the perfect dimensions for your certificate</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 px-2 sm:px-0">
                  {sizeOptions.map((option) => (
                    <div
                      key={option.size}
                      onClick={() => handleSizeSelect(option.size)}
                      className={`cursor-pointer p-3 sm:p-4 rounded-lg border transition-colors relative ${formData.size === option.size
                          ? 'border-yellow-500 bg-yellow-900/30 shadow-lg'
                          : 'border-gray-600 hover:border-yellow-400'
                        }`}
                    >
                      {option.popular && (
                        <div className="absolute -top-1 sm:-top-2 -right-1 sm:-right-2 text-black text-xs font-medium px-2 sm:px-3 py-1 rounded-full shadow-lg" style={{ background: 'linear-gradient(135deg, #e4b833 0%, #f8df51 100%)' }}>
                          Popular
                        </div>
                      )}
                      <div className="text-center space-y-2 sm:space-y-3">
                        <div className={`mx-auto rounded overflow-hidden ${option.size === '5x7' ? 'w-12 sm:w-16 h-auto' :
                            option.size === '6x6' ? 'w-14 sm:w-18 h-auto' :
                            option.size === '6x8' ? 'w-16 sm:w-20 h-auto' : 'w-18 sm:w-22 h-auto'
                          }`}>
                          <Image
                            src="/certificate.webp"
                            alt="Certificate preview"
                            width={1000}
                            height={960}
                            className="w-full h-full"
                          />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white text-sm sm:text-base">{option.label}</h3>
                          <p className="text-xs sm:text-sm text-gray-300">{option.dimensions}</p>
                          <p className="text-base sm:text-lg font-bold text-white">{option.price}</p>
                        </div>
                        {formData.size === option.size && (
                          <div className="flex items-center justify-center space-x-1 sm:space-x-2 text-yellow-400">
                            <CheckCircleIcon className="w-3 sm:w-4 h-3 sm:h-4" />
                            <span className="text-xs sm:text-sm font-medium">Selected</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Personal Information & Shipping */}
            {currentStep === 3 && (
              <div className="space-y-6 sm:space-y-8">
                <div className="text-center mb-6 sm:mb-8">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2 sm:mb-3 tracking-tight px-2">Personal Information & Shipping</h2>
                  <p className="text-gray-400 text-sm sm:text-base lg:text-lg leading-relaxed px-2">Add your details and shipping information</p>
                </div>
                
                {/* Personal Information Section */}
                <div className="rounded-xl backdrop-blur-sm max-w-4xl mx-auto px-2 sm:px-0">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 tracking-wide">Personal Information</h3>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-1 sm:space-y-2">
                        <label htmlFor="firstName" className="text-xs sm:text-sm font-semibold text-gray-200 tracking-wide">First Name *</label>
                        <input
                          id="firstName"
                          type="text"
                          value={formData.personalData.firstName}
                          onChange={(e) => handlePersonalDataChange('firstName', e.target.value)}
                          placeholder="Enter your first name"
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-500/60 bg-black/80 text-white rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/70 focus:border-yellow-500/50 focus:bg-black transition-all duration-300 shadow-sm hover:border-gray-400/70 backdrop-blur-sm placeholder-gray-400 text-sm sm:text-base"
                        />
                      </div>
                      <div className="space-y-1 sm:space-y-2">
                        <label htmlFor="lastName" className="text-xs sm:text-sm font-semibold text-gray-200 tracking-wide">Last Name *</label>
                        <input
                          id="lastName"
                          type="text"
                          value={formData.personalData.lastName}
                          onChange={(e) => handlePersonalDataChange('lastName', e.target.value)}
                          placeholder="Enter your last name"
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-500/60 bg-black/80 text-white rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/70 focus:border-yellow-500/50 focus:bg-black transition-all duration-300 shadow-sm hover:border-gray-400/70 backdrop-blur-sm placeholder-gray-400 text-sm sm:text-base"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-1 sm:space-y-2">
                        <label htmlFor="email" className="text-xs sm:text-sm font-semibold text-gray-200 tracking-wide">Email Address *</label>
                        <input
                          id="email"
                          type="email"
                          value={formData.personalData.email}
                          onChange={(e) => handlePersonalDataChange('email', e.target.value)}
                          placeholder="your@email.com"
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-500/60 bg-black/80 text-white rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/70 focus:border-yellow-500/50 focus:bg-black transition-all duration-300 shadow-sm hover:border-gray-400/70 backdrop-blur-sm placeholder-gray-400 text-sm sm:text-base"
                        />
                      </div>
                      <div className="space-y-1 sm:space-y-2">
                        <label htmlFor="phone" className="text-xs sm:text-sm font-semibold text-gray-200 tracking-wide">Phone Number <span className="text-gray-400">(Optional)</span></label>
                        <input
                          id="phone"
                          type="tel"
                          value={formData.personalData.phone}
                          onChange={(e) => handlePersonalDataChange('phone', e.target.value)}
                          placeholder="+1 (555) 123-4567"
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-500/60 bg-black/80 text-white rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/70 focus:border-yellow-500/50 focus:bg-black transition-all duration-300 shadow-sm hover:border-gray-400/70 backdrop-blur-sm placeholder-gray-400 text-sm sm:text-base"
                        />
                      </div>
                    </div>

                  </div>
                </div>

                {/* Shipping Information Section */}
                <div className="rounded-xl backdrop-blur-sm max-w-4xl mx-auto px-2 sm:px-0">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 tracking-wide">Shipping Information</h3>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-1 sm:space-y-2">
                        <label htmlFor="address" className="text-xs sm:text-sm font-semibold text-gray-200 tracking-wide">Address *</label>
                        <input
                          id="address"
                          type="text"
                          value={formData.shippingData.address}
                          onChange={(e) => handleShippingDataChange('address', e.target.value)}
                          placeholder="123 Main Street"
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-500/60 bg-black/80 text-white rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/70 focus:border-yellow-500/50 focus:bg-black transition-all duration-300 shadow-sm hover:border-gray-400/70 backdrop-blur-sm placeholder-gray-400 text-sm sm:text-base"
                        />
                      </div>
                      <div className="space-y-1 sm:space-y-2">
                        <label htmlFor="city" className="text-xs sm:text-sm font-semibold text-gray-200 tracking-wide">City *</label>
                        <input
                          id="city"
                          type="text"
                          value={formData.shippingData.city}
                          onChange={(e) => handleShippingDataChange('city', e.target.value)}
                          placeholder="New York"
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-500/60 bg-black/80 text-white rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/70 focus:border-yellow-500/50 focus:bg-black transition-all duration-300 shadow-sm hover:border-gray-400/70 backdrop-blur-sm placeholder-gray-400 text-sm sm:text-base"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-1 sm:space-y-2">
                        <label htmlFor="postalCode" className="text-xs sm:text-sm font-semibold text-gray-200 tracking-wide">Postal Code *</label>
                        <input
                          id="postalCode"
                          type="text"
                          value={formData.shippingData.postalCode}
                          onChange={(e) => handleShippingDataChange('postalCode', e.target.value)}
                          placeholder="10001"
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-500/60 bg-black/80 text-white rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/70 focus:border-yellow-500/50 focus:bg-black transition-all duration-300 shadow-sm hover:border-gray-400/70 backdrop-blur-sm placeholder-gray-400 text-sm sm:text-base"
                        />
                      </div>
                      <div className="space-y-1 sm:space-y-2">
                        <label htmlFor="country" className="text-xs sm:text-sm font-semibold text-gray-200 tracking-wide">Country *</label>
                        <select
                          id="country"
                          value={formData.shippingData.country}
                          onChange={(e) => handleShippingDataChange('country', e.target.value)}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-500/60 bg-black/80 text-white rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/70 focus:border-yellow-500/50 focus:bg-black transition-all duration-300 shadow-sm hover:border-gray-400/70 backdrop-blur-sm text-sm sm:text-base"
                        >
                          <option value="">Select a country</option>
                          <option value="Afghanistan">Afghanistan</option>
                          <option value="Albania">Albania</option>
                          <option value="Algeria">Algeria</option>
                          <option value="Argentina">Argentina</option>
                          <option value="Australia">Australia</option>
                          <option value="Austria">Austria</option>
                          <option value="Bangladesh">Bangladesh</option>
                          <option value="Belgium">Belgium</option>
                          <option value="Brazil">Brazil</option>
                          <option value="Canada">Canada</option>
                          <option value="Chile">Chile</option>
                          <option value="China">China</option>
                          <option value="Colombia">Colombia</option>
                          <option value="Denmark">Denmark</option>
                          <option value="Egypt">Egypt</option>
                          <option value="Finland">Finland</option>
                          <option value="France">France</option>
                          <option value="Germany">Germany</option>
                          <option value="Greece">Greece</option>
                          <option value="India">India</option>
                          <option value="Indonesia">Indonesia</option>
                          <option value="Ireland">Ireland</option>
                          <option value="Italy">Italy</option>
                          <option value="Japan">Japan</option>
                          <option value="Mexico">Mexico</option>
                          <option value="Netherlands">Netherlands</option>
                          <option value="New Zealand">New Zealand</option>
                          <option value="Norway">Norway</option>
                          <option value="Peru">Peru</option>
                          <option value="Poland">Poland</option>
                          <option value="Portugal">Portugal</option>
                          <option value="Russia">Russia</option>
                          <option value="South Africa">South Africa</option>
                          <option value="South Korea">South Korea</option>
                          <option value="Spain">Spain</option>
                          <option value="Sweden">Sweden</option>
                          <option value="Switzerland">Switzerland</option>
                          <option value="Thailand">Thailand</option>
                          <option value="Turkey">Turkey</option>
                          <option value="United Kingdom">United Kingdom</option>
                          <option value="United States">United States</option>
                          <option value="Venezuela">Venezuela</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Special Notes Section */}
                <div className="rounded-xl backdrop-blur-sm max-w-4xl mx-auto px-2 sm:px-0">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 tracking-wide">Special Notes</h3>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="space-y-1 sm:space-y-2">
                      <label htmlFor="notes" className="text-xs sm:text-sm font-semibold text-gray-200 tracking-wide">Special Notes <span className="text-gray-400">(Optional)</span></label>
                      <textarea
                        id="notes"
                        value={formData.specialNotes}
                        onChange={(e) => setFormData({ ...formData, specialNotes: e.target.value })}
                        rows={3}
                        placeholder="Any special instructions or customization requests..."
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-500/60 bg-black/80 text-white rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/70 focus:border-yellow-500/50 focus:bg-black transition-all duration-300 resize-vertical shadow-sm hover:border-gray-400/70 backdrop-blur-sm placeholder-gray-400 text-sm sm:text-base"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* Step 4: Review & Confirm */}
          {currentStep === 4 && (
              <div className="space-y-4 sm:space-y-6">
                <div className="text-center mb-6 sm:mb-8 px-2 sm:px-0">
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 sm:mb-3 tracking-tight">Review & Confirm</h2>
                  <p className="text-gray-400 text-base sm:text-lg leading-relaxed">Please review your order details before proceeding to payment</p>
                </div>
                <div className="max-w-2xl mx-auto px-2 sm:px-0">
                  <div className="bg-black/90 border border-yellow-600/40 rounded-xl sm:rounded-2xl shadow-2xl backdrop-blur-md ring-1 ring-yellow-600/20">
                    <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-yellow-600/30">
                      <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">Order Summary</h3>
                    </div>
                    <div className="p-4 sm:p-6 space-y-2 sm:space-y-3">
                      <div className="flex justify-between items-center py-1 border-b border-yellow-600/20">
                        <span className="text-xs sm:text-sm font-semibold text-yellow-300 tracking-wide">Certificate Size:</span>
                        <span className="text-xs sm:text-sm font-bold text-white capitalize text-right">
                          {getProductInfo(formData.size).label} ({getProductInfo(formData.size).dimensions})
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-yellow-600/20">
                        <span className="text-xs sm:text-sm font-semibold text-yellow-300 tracking-wide">Your Name:</span>
                        <span className="text-xs sm:text-sm font-bold text-white text-right">{formData.personalData.firstName} {formData.personalData.lastName}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-yellow-600/20">
                        <span className="text-xs sm:text-sm font-semibold text-yellow-300 tracking-wide">Email:</span>
                        <span className="text-xs sm:text-sm font-bold text-white text-right break-all">{formData.personalData.email}</span>
                      </div>
                      {formData.personalData.phone && (
                        <div className="flex justify-between items-center py-1 border-b border-yellow-600/20">
                          <span className="text-xs sm:text-sm font-semibold text-yellow-300 tracking-wide">Phone:</span>
                          <span className="text-xs sm:text-sm font-bold text-white text-right">{formData.personalData.phone}</span>
                        </div>
                      )}
                    <div className="flex justify-between items-center py-1 border-b border-yellow-600/20">
                      <span className="text-xs sm:text-sm font-semibold text-yellow-300 tracking-wide">Shipping Address:</span>
                      <span className="text-xs sm:text-sm font-bold text-white text-right">{formData.shippingData.address}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-yellow-600/20">
                      <span className="text-xs sm:text-sm font-semibold text-yellow-300 tracking-wide">City:</span>
                      <span className="text-xs sm:text-sm font-bold text-white text-right">{formData.shippingData.city}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-yellow-600/20">
                      <span className="text-xs sm:text-sm font-semibold text-yellow-300 tracking-wide">Postal Code:</span>
                      <span className="text-xs sm:text-sm font-bold text-white text-right">{formData.shippingData.postalCode}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-yellow-600/20">
                       <span className="text-xs sm:text-sm font-semibold text-yellow-300 tracking-wide">Country:</span>
                       <span className="text-xs sm:text-sm font-bold text-white text-right">{formData.shippingData.country}</span>
                     </div>
                       {formData.specialNotes && (
                         <div className="py-1 border-b border-yellow-600/20">
                           <span className="text-xs sm:text-sm font-semibold text-yellow-300 tracking-wide block mb-1">Special Notes:</span>
                           <div className="bg-yellow-900/20 rounded-lg p-2 border border-yellow-600/30">
                             <span className="text-xs sm:text-sm font-medium text-white">{formData.specialNotes}</span>
                           </div>
                         </div>
                       )}
                      <div className="rounded-lg sm:rounded-xl p-3 sm:p-4 border border-yellow-500/50 shadow-xl backdrop-blur-sm" style={{ background: 'linear-gradient(135deg, rgba(228, 184, 51, 0.3) 0%, rgba(248, 223, 81, 0.15) 100%)' }}>
                        <div className="flex justify-between items-center">
                          <span className="text-base sm:text-lg font-bold text-yellow-300 tracking-wide">Total:</span>
                          <span className="text-base sm:text-lg font-bold text-yellow-400">
                            {getProductInfo(formData.size).price}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}



            {/* Navigation Buttons */}
            <div className="pt-6 sm:pt-10 px-2 sm:px-0">
              {currentStep < 4 ? (
                <div className="flex gap-3">
                  {currentStep > 1 && (
                    <button
                      onClick={prevStep}
                      className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-3 sm:py-4 bg-gray-800/80 text-white rounded-lg sm:rounded-xl hover:bg-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-sm border border-gray-600/30 text-sm sm:text-base font-bold tracking-wide"
                    >
                      <ArrowLeftIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      {/* <span>Back</span> */}
                    </button>
                  )}
                  <button
                    onClick={nextStep}
                    disabled={
                      (currentStep === 1 && !formData.image) ||
                      (currentStep === 2 && !formData.size) ||
                      (currentStep === 3 && (!formData.personalData.firstName || !formData.personalData.lastName || !formData.personalData.email || !formData.shippingData.address || !formData.shippingData.city || !formData.shippingData.postalCode || !formData.shippingData.country))
                    }
                    className={`flex-1 flex items-center justify-center space-x-2 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base lg:text-lg tracking-wide transition-all duration-300 shadow-xl ${
                       (currentStep === 1 && !formData.image) ||
                       (currentStep === 2 && !formData.size) ||
                       (currentStep === 3 && (!formData.personalData.firstName || !formData.personalData.lastName || !formData.personalData.email || !formData.shippingData.address || !formData.shippingData.city || !formData.shippingData.postalCode || !formData.shippingData.country))
                         ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                         : 'text-black hover:shadow-2xl transform hover:scale-105'
                     }`}
                     style={{
                       background: (currentStep === 1 && !formData.image) ||
                                  (currentStep === 2 && !formData.size) ||
                                  (currentStep === 3 && (!formData.personalData.firstName || !formData.personalData.lastName || !formData.personalData.email || !formData.shippingData.address || !formData.shippingData.city || !formData.shippingData.postalCode || !formData.shippingData.country))
                         ? undefined
                         : 'linear-gradient(135deg, #e4b833 0%, #f8df51 100%)'
                     }}
                    >
                      <span>Next</span>
                      <ArrowRightIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                </div>
              ) : (
                <button
                onClick={handleSubmit}
                disabled={
                  isSubmitting ||
                  !formData.image || 
                  !formData.size || 
                  !formData.personalData.firstName || 
                  !formData.personalData.lastName || 
                  !formData.personalData.email ||
                  !formData.shippingData.address ||
                  !formData.shippingData.city ||
                  !formData.shippingData.postalCode ||
                  !formData.shippingData.country
                }
                className={`w-full flex items-center justify-center space-x-2 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base lg:text-lg tracking-wide transition-all duration-300 shadow-xl ${
                  isSubmitting ||
                  !formData.image || 
                  !formData.size || 
                  !formData.personalData.firstName || 
                  !formData.personalData.lastName || 
                  !formData.personalData.email ||
                  !formData.shippingData.address ||
                  !formData.shippingData.city ||
                  !formData.shippingData.postalCode ||
                  !formData.shippingData.country
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'text-black hover:shadow-2xl transform hover:scale-105'
                }`}
                style={{
                  background: isSubmitting ||
                             !formData.image || 
                             !formData.size || 
                              !formData.personalData.firstName ||
                               !formData.personalData.lastName ||
                               !formData.personalData.email ||
                             !formData.shippingData.address ||
                             !formData.shippingData.city ||
                             !formData.shippingData.postalCode ||
                             !formData.shippingData.country
                    ? undefined
                    : 'linear-gradient(135deg, #e4b833 0%, #f8df51 100%)'
                }}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                      <span>Sending order...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete Order</span>
                      <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
