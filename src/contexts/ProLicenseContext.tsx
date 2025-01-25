import React, { createContext, useContext, useState } from 'react';

type ProLicenseState = {
  isPro: boolean;
  licenseKey: string | null;
};

type ProLicenseContextType = {
  isPro: boolean;
  licenseKey: string | null;
  setLicenseKey: (key: string | null) => void;
  validateLicense: () => Promise<boolean>;
  clearLicense: () => void;
};

const ProLicenseContext = createContext<ProLicenseContextType | null>(null);

export const useProLicense = () => {
  const context = useContext(ProLicenseContext);
  if (!context) {
    throw new Error('useProLicense must be used within a ProLicenseProvider');
  }
  return context;
};

type ProLicenseProviderProps = {
  children: React.ReactNode;
  initialState?: ProLicenseState;
};

export const ProLicenseProvider: React.FC<ProLicenseProviderProps> = ({ 
  children, 
  initialState = { isPro: false, licenseKey: null }
}) => {
  const [state, setState] = useState<ProLicenseState>(initialState);

  const setLicenseKey = (key: string | null) => {
    setState(prev => ({ 
      ...prev, 
      licenseKey: key,
      isPro: !!key
    }));
  };

  const validateLicense = async () => {
    if (!state.licenseKey) return false;
    // Mock validation for tests
    return Promise.resolve(true);
  };

  const clearLicense = () => {
    setState({ isPro: false, licenseKey: null });
  };

  return (
    <ProLicenseContext.Provider
      value={{
        ...state,
        setLicenseKey,
        validateLicense,
        clearLicense,
      }}
    >
      {children}
    </ProLicenseContext.Provider>
  );
}; 