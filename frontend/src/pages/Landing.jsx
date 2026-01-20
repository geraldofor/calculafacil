import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calculator, TrendingUp, Clock, Shield, Zap, Users } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">Calcula Fácil</span>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => navigate('/auth?mode=login')}>
              Entrar
            </Button>
            <Button onClick={() => navigate('/auth?mode=register')}>
              Cadastrar Grátis
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6" data-testid="landing-hero-title">
            Sistema Unificado de Cálculos para Consolidadoras
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Agilize seus cálculos de tarifas, conversões e reemissões em todos os principais GDS.
            Economize tempo e reduza erros.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/auth?mode=register')} data-testid="cta-start-button">
              <Zap className="mr-2 h-5 w-5" />
              Começar Agora
            </Button>
            <Button size="lg" variant="outline" onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}>
              Conhecer Recursos
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Recursos Principais</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="p-6">
            <Calculator className="h-12 w-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Cálculo de Tarifas</h3>
            <p className="text-gray-600">
              Amadeus, Galileo e Sabre. Calcule tarifas com precisão, incluindo RAV e fees.
            </p>
          </Card>

          <Card className="p-6">
            <TrendingUp className="h-12 w-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Conversor de Itinerários</h3>
            <p className="text-gray-600">
              Converta itinerários de GDS para formato WhatsApp em segundos.
            </p>
          </Card>

          <Card className="p-6">
            <Clock className="h-12 w-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Reemissão Automática</h3>
            <p className="text-gray-600">
              Calcule reemissões complexas com validação automática dos valores.
            </p>
          </Card>

          <Card className="p-6">
            <Shield className="h-12 w-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Histórico Seguro</h3>
            <p className="text-gray-600">
              Todos os cálculos salvos com segurança na nuvem. Acesse de qualquer lugar.
            </p>
          </Card>

          <Card className="p-6">
            <Zap className="h-12 w-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Ultra Rápido</h3>
            <p className="text-gray-600">
              Interface otimizada para agilidade. Menos cliques, mais produtividade.
            </p>
          </Card>

          <Card className="p-6">
            <Users className="h-12 w-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Suporte Dedicado</h3>
            <p className="text-gray-600">
              Equipe especializada em GDS pronta para ajudar você.
            </p>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-16 bg-gray-50 rounded-lg my-16">
        <h2 className="text-3xl font-bold text-center mb-4">Preço Acessível</h2>
        <p className="text-center text-gray-600 mb-12">Plano individual para agentes e consolidadoras</p>
        
        <div className="max-w-md mx-auto">
          <Card className="p-8 border-2 border-blue-600">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Plano Profissional</h3>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-5xl font-bold">R$ 39,90</span>
                <span className="text-gray-600">/mês</span>
              </div>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs">✓</div>
                <span>Todos os GDS (Amadeus, Galileo, Sabre)</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs">✓</div>
                <span>Cálculos ilimitados</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs">✓</div>
                <span>Histórico completo</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs">✓</div>
                <span>Suporte prioritário</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs">✓</div>
                <span>Atualizações gratuitas</span>
              </li>
            </ul>
            <Button className="w-full" size="lg" onClick={() => navigate('/auth?mode=register')} data-testid="pricing-cta-button">
              Começar Agora
            </Button>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>© 2025 Calcula Fácil. Sistema para consolidadoras de viagens.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
