import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Theme } from '@radix-ui/themes';
import { Index } from './pages/Index';
import { NotFound } from './pages/NotFound';

/**
 * App - Root application component
 * Sets up routing and theming for the entire application
 */
export const App: React.FC = () => (
  <Theme accentColor="jade" radius="medium">
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </Theme>
);
