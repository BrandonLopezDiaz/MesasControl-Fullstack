import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock API calls
jest.mock('../../api/ListaProductos', () => ({
  fetchConfiguraciones: jest.fn(),
  updateConfiguracion: jest.fn(),
}));

// Mock ThemeProvider
jest.mock('../../components/ThemeProvider', () => ({
  useTheme: () => ({ theme: 'default', setTheme: jest.fn() }),
  TEMAS: [
    { id: 'default', label: 'Default', emoji: '🟢', desc: 'Classic' },
    { id: 'noche', label: 'Night', emoji: '🌙', desc: 'Dark' },
  ],
}));

import { fetchConfiguraciones, updateConfiguracion } from '../../api/ListaProductos';

const MOCK_CONFIGS = [
  { id: 1, clave: 'tiempo_alerta_cocina', valor: '15', descripcion: 'Alerta en cocina' },
  { id: 2, clave: 'nombre_local', valor: 'Mi Taquería', descripcion: 'Nombre del local' },
  { id: 3, clave: 'feature_barra', valor: 'true', descripcion: 'Barra visible' },
  { id: 4, clave: 'feature_para_llevar', valor: 'false', descripcion: 'Para llevar visible' },
];

function renderPage() {
  return render(<ConfigPage />);
}

// Need to import after mocks are set up
let ConfigPage;

beforeAll(() => {
  ConfigPage = require('../ConfigPage').default;
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ConfigPage', () => {
  it('renders title and loads configs on mount', async () => {
    fetchConfiguraciones.mockResolvedValue(MOCK_CONFIGS);

    renderPage();

    expect(screen.getByText('⚙️ Configuración')).toBeInTheDocument();
    expect(screen.getByText('🎨 Tema visual')).toBeInTheDocument();
    expect(screen.getByText('📋 Ajustes del sistema')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('tiempo_alerta_cocina')).toBeInTheDocument();
    });
  });

  it('shows theme options', async () => {
    fetchConfiguraciones.mockResolvedValue(MOCK_CONFIGS);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Default')).toBeInTheDocument();
    });
    expect(screen.getByText('Night')).toBeInTheDocument();
  });

  it('shows value for each config', async () => {
    fetchConfiguraciones.mockResolvedValue(MOCK_CONFIGS);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Mi Taquería')).toBeInTheDocument();
    });
  });

  it('shows active chip for enabled feature', async () => {
    fetchConfiguraciones.mockResolvedValue(MOCK_CONFIGS);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('✓ activo')).toBeInTheDocument();
    });
  });

  it('shows inactive chip for disabled feature', async () => {
    fetchConfiguraciones.mockResolvedValue(MOCK_CONFIGS);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('✕ inactivo')).toBeInTheDocument();
    });
  });

  it('allows editing a text config', async () => {
    fetchConfiguraciones.mockResolvedValue(MOCK_CONFIGS);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('tiempo_alerta_cocina')).toBeInTheDocument();
    });

    // Click edit
    const editButtons = screen.getAllByText('editar');
    fireEvent.click(editButtons[0]);

    // Input should now be visible
    const input = screen.getByDisplayValue('15');
    expect(input).toBeInTheDocument();

    // Change value
    fireEvent.change(input, { target: { value: '20' } });

    // Click guardar
    updateConfiguracion.mockResolvedValue({
      id: 1, clave: 'tiempo_alerta_cocina', valor: '20', descripcion: 'Alerta en cocina',
    });
    fireEvent.click(screen.getByText('guardar'));

    await waitFor(() => {
      expect(updateConfiguracion).toHaveBeenCalledWith(1, {
        clave: 'tiempo_alerta_cocina',
        valor: '20',
        descripcion: 'Alerta en cocina',
      });
    });
  });

  it('allows toggling a feature flag', async () => {
    fetchConfiguraciones.mockResolvedValue(MOCK_CONFIGS);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('✓ activo')).toBeInTheDocument();
    });

    updateConfiguracion.mockResolvedValue({
      id: 3, clave: 'feature_barra', valor: 'false', descripcion: 'Barra visible',
    });

    // Click the toggle chip
    fireEvent.click(screen.getByText('✓ activo'));

    await waitFor(() => {
      expect(updateConfiguracion).toHaveBeenCalledWith(3, {
        clave: 'feature_barra',
        valor: 'false',
        descripcion: 'Barra visible',
      });
    });
  });

  it('handles API error gracefully', async () => {
    fetchConfiguraciones.mockRejectedValue(new Error('API error'));

    renderPage();

    // Should still render without crashing
    expect(screen.getByText('⚙️ Configuración')).toBeInTheDocument();
  });
});
