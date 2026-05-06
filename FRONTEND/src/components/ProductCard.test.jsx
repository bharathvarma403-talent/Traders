import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ProductCard from './ProductCard';

// Mock matchMedia if needed for Framer Motion, though not strictly required here
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('ProductCard', () => {
  it('renders an <img> with a valid src when given a product with a real imageUrl', () => {
    const mockProduct = {
      name: 'Test Product',
      imageUrl: 'https://test.com/valid-image.png',
      price: 100,
      category: 'Test',
    };

    render(
      <ProductCard 
        product={mockProduct} 
        onReserve={vi.fn()} 
        isBroken={false} 
        API_URL="" 
      />
    );

    const imgElement = screen.getByAltText('Test Product');
    expect(imgElement).toBeDefined();
    expect(imgElement.getAttribute('src')).toBe('https://test.com/valid-image.png');
  });

  it('renders a placeholder when the image fails to load', () => {
    // This tests the logic for onError since jsdom does not trigger natural img loads
    // We would manually trigger onError event
    const mockProduct = {
      name: 'Test Product',
      imageUrl: 'https://test.com/broken-image.png',
      price: 100,
      category: 'Test',
    };

    render(
      <ProductCard 
        product={mockProduct} 
        onReserve={vi.fn()} 
        isBroken={false} 
        API_URL="" 
      />
    );

    const imgElement = screen.getByAltText('Test Product');
    
    // Simulate onError
    imgElement.dispatchEvent(new Event('error'));
    
    expect(imgElement.getAttribute('src')).toBe('/placeholder.png');
  });
});
