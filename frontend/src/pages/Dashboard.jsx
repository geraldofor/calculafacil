import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/auth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calculator, LogOut, User, History, Shield } from 'lucide-react';
import Tarifa from '@/components/calculators/Tarifa';
import Conversor from '@/components/calculators/Conversor';
import Reemissao from '@/components/calculators/Reemissao';
import Admin from '@/pages/Admin';

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('tarifa');
  const user = authService.getCurrentUser();
  const isAdmin = user?.role === 'admin';

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  if (!authService.isAuthenticated()) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-[#001e3c] text-white flex flex-col p-5" data-testid="dashboard-sidebar">
        <div className="mb-12 pb-6 border-b border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="h-6 w-6" />
            <span className="text-xl font-bold">CALCULA FÁCIL</span>
          </div>
          <p className="text-xs text-gray-400">Sistema Unificado</p>
        </div>

        <nav className="flex-1 mt-4">
          <button
            className={`w-full text-left px-4 py-3 rounded-lg mb-2 flex items-center gap-3 transition ${
              activeTab === 'tarifa'
                ? 'bg-white/10 text-white border-l-4 border-blue-500'
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
            onClick={() => setActiveTab('tarifa')}
            data-testid="tab-tarifa"
          >
            <Calculator className="h-5 w-5" />
            Tarifas
          </button>

          <button
            className={`w-full text-left px-4 py-3 rounded-lg mb-2 flex items-center gap-3 transition ${
              activeTab === 'conversor'
                ? 'bg-white/10 text-white border-l-4 border-blue-500'
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
            onClick={() => setActiveTab('conversor')}
            data-testid="tab-conversor"
          >
            <History className="h-5 w-5" />
            Conversor
          </button>

          <button
            className={`w-full text-left px-4 py-3 rounded-lg mb-2 flex items-center gap-3 transition ${
              activeTab === 'reemissao'
                ? 'bg-white/10 text-white border-l-4 border-blue-500'
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
            onClick={() => setActiveTab('reemissao')}
            data-testid="tab-reemissao"
          >
            <Calculator className="h-5 w-5" />
            Reemissão
          </button>

          {isAdmin && (
            <>
              <div className="my-4 border-t border-gray-700"></div>
              <button
                className={`w-full text-left px-4 py-3 rounded-lg mb-2 flex items-center gap-3 transition ${
                  activeTab === 'admin'
                    ? 'bg-white/10 text-white border-l-4 border-blue-500'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
                onClick={() => setActiveTab('admin')}
                data-testid="tab-admin"
              >
                <Shield className="h-5 w-5" />
                Admin
              </button>
            </>
          )}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-[#001e3c] text-white px-8 py-4 flex justify-between items-center">
          <div>
            <span className="text-sm text-gray-400">Sistema Unificado de Reservas</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-green-400">●</span>
              <span className="text-sm">Online - {user?.full_name || 'Usuário'}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10"
              onClick={handleLogout}
              data-testid="logout-button"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-8">
          {activeTab === 'tarifa' && <Tarifa />}
          {activeTab === 'conversor' && <Conversor />}
          {activeTab === 'reemissao' && <Reemissao />}
          {activeTab === 'admin' && isAdmin && <Admin />}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
