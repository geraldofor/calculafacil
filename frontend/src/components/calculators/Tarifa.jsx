import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Calculator as CalcIcon } from 'lucide-react';
import { copyToClipboard } from '@/utils/formatters';
import { calculationService } from '@/services/calculations';
import { useToast } from '@/hooks/use-toast';
import { aeroDB, ciasDB } from '@/utils/gdsData';

const decodeItinerary = (text) => {
  if (!text) return null;
  const lines = text.toUpperCase().split('\n');
  const flights = [];

  lines.forEach((line) => {
    if (!line.trim()) return;

    // Clean up prefix like "2. " or "2 " or "  2.  "
    const cleanedLine = line.replace(/^\s*\d+\.?\s+/, '').trim();

    // Regex for GDS flight lines
    const match = cleanedLine.match(
      /^([A-Z0-9]{2})\s*(\d{1,5})\s*([A-Z])?\s+(\d{2}[A-Z]{3})\s*[1-7]?[\*]?\s*([A-Z]{3})([A-Z]{3})\s+([A-Z]{2}\d?)\s+[^0-9]*(\d{4})\s+[^0-9]*(\d{4})/
    );

    if (match) {
      const cia = ciasDB[match[1]] || match[1];
      const orgCode = match[5];
      const dstCode = match[6];
      const org = aeroDB[orgCode] ? `${aeroDB[orgCode]} (${orgCode})` : `${orgCode} (${orgCode})`;
      const dst = aeroDB[dstCode] ? `${aeroDB[dstCode]} (${dstCode})` : `${dstCode} (${dstCode})`;
      const dep = `${match[8].slice(0, 2)}:${match[8].slice(2)}`;
      const arr = `${match[9].slice(0, 2)}:${match[9].slice(2)}`;
      const date = match[4];

      flights.push({
        ciaCode: match[1],
        cia,
        numero: match[2],
        data: date,
        origem: org,
        destino: dst,
        partida: dep,
        chegada: arr,
      });
    }
  });

  if (flights.length === 0) return null;

  let maxOrigem = 0;
  let maxDestino = 0;
  flights.forEach((f) => {
    if (f.origem.length > maxOrigem) maxOrigem = f.origem.length;
    if (f.destino.length > maxDestino) maxDestino = f.destino.length;
  });
  maxOrigem += 2;
  maxDestino += 2;

  let res = '';
  flights.forEach((f) => {
    const orgFormatted = f.origem.padEnd(maxOrigem, ' ');
    const dstFormatted = f.destino.padEnd(maxDestino, ' ');
    res += `${f.cia} ${f.numero} ➔ ${f.data} ➔ ${orgFormatted}${f.partida} ➔ ${dstFormatted}${f.chegada}\n`;
  });

  return { res, firstCia: flights[0]?.ciaCode || '' };
};

const Tarifa = () => {
  const { toast } = useToast();
  const [gds, setGds] = useState('amadeus');
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState('Aguardando dados...');
  
  const [formData, setFormData] = useState({
    roteiro: '',
    voo: 'Tap',
    cabine: 'ECONOMY STANDARD',
    bagagem: 'No Bag',
    fee: '150',
    rav: '7',
    multaReem: '',
    multaReeb: '',
    parcelamento: '10x sem juros',
    aplicarMarkup: false,
    markup: '10',
  });

  const processarTarifa = async () => {
    try {
      const raw = inputText.toUpperCase();
      let tUSD = 0, tBRL = 0, totalBRL = 0;

      if (gds === 'amadeus') {
        const usdM = raw.match(/USD\s*(\d+[.,]\d*)/i);
        tUSD = usdM ? parseFloat(usdM[1].replace(',', '.')) : 0;
        const brls = raw.match(/BRL\s*(\d+[.,]\d{2})/gi) || [];
        tBRL = brls[0] ? parseFloat(brls[0].replace(/BRL\s+/i, '').replace(',', '.')) : 0;
        totalBRL = brls[brls.length - 1] ? parseFloat(brls[brls.length - 1].replace(/BRL\s+/i, '').replace(',', '.')) : 0;
        if (tUSD === 0) {
          const nucM = raw.match(/NUC\s*(\d+[.,]\d*)/i);
          tUSD = nucM ? parseFloat(nucM[1].replace(',', '.')) : 0;
        }
      } else if (gds === 'galileo') {
        const galM = raw.match(/FQG\s*\d+\s+BRL\s+(\d+\.\d{2})\s+(\d+\.\d{2})\s+(\d+\.\d{2})/i);
        if (galM) {
          tBRL = parseFloat(galM[1]);
          totalBRL = parseFloat(galM[3]);
        }
        const bsrM = raw.match(/BSR\s*1USD\s*-\s*(\d+\.\d+)/i);
        tUSD = bsrM ? tBRL / parseFloat(bsrM[1]) : 0;
      } else if (gds === 'sabre') {
        const usdM = raw.match(/USD\s*(\d+\.\d{2})/i);
        tUSD = usdM ? parseFloat(usdM[1]) : 0;
        const brls = raw.match(/BRL\s*(\d+\.\d{2})/gi) || [];
        tBRL = brls[0] ? parseFloat(brls[0].replace(/BRL\s*/i, '')) : 0;
        const totM = raw.match(/BRL\s*(\d+\.\d{2})\s+ADT/i);
        totalBRL = totM ? parseFloat(totM[1]) : 0;
      }

      // APLICAR MARKUP se ativo
      let tUSDOriginal = tUSD;
      let tBRLOriginal = tBRL;
      let totalBRLOriginal = totalBRL;
      let tarifaComMarkup = false;
      
      if (formData.aplicarMarkup && parseFloat(formData.markup) > 0) {
        const markupPercent = parseFloat(formData.markup);
        
        // Calcular novo USD com markup
        tUSD = tUSD / (1 - markupPercent / 100);
        
        // Recalcular BRL baseado no novo USD
        // Extrair cotação do GDS (RATE USED ou calcular)
        let cotacao = 1;
        const rateMatch = raw.match(/RATE USED 1USD=(\d+\.\d+)/i);
        if (rateMatch) {
          cotacao = parseFloat(rateMatch[1]);
        } else if (tUSDOriginal > 0 && tBRLOriginal > 0) {
          cotacao = tBRLOriginal / tUSDOriginal;
        }
        
        // Recalcular tarifa BRL com markup
        tBRL = tUSD * cotacao;
        
        // Recalcular total BRL (nova tarifa + taxas)
        const taxas = totalBRLOriginal - tBRLOriginal;
        totalBRL = tBRL + taxas;
        
        tarifaComMarkup = true;
      }

      const ravVal = tBRL * (parseFloat(formData.rav) / 100);
      const feeVal = parseFloat(formData.fee || 0);
      const final = totalBRL + ravVal + feeVal;

      // Processar Roteiro
      let roteiroHeader = '';
      let updatedVoo = formData.voo;

      if (formData.roteiro.trim()) {
        const decoded = decodeItinerary(formData.roteiro);
        if (decoded && decoded.res) {
          roteiroHeader = `Roteiro:\n${decoded.res}\n`;
          if (decoded.firstCia && (!formData.voo || formData.voo === 'Tap')) {
            updatedVoo = decoded.firstCia;
            setFormData(prev => ({ ...prev, voo: decoded.firstCia }));
          }
        } else {
          roteiroHeader = `Roteiro:   ${formData.roteiro}\n`;
        }
      }

      const formatMetaLine = (label, value) => {
        return `${label.padEnd(10, ' ')} ${value}`;
      };

      let res = roteiroHeader;
      res += formatMetaLine('Cia/Voo:', updatedVoo) + '\n';
      res += formatMetaLine('Cabine:', formData.cabine) + '\n';
      res += formatMetaLine('Bagagem:', formData.bagagem) + '\n';
      res += '----------------------------------------\n';
      
      const formatValueLine = (label, currency, val) => {
        return `${label.padEnd(24, ' ')} ${currency} ${val.toFixed(2).padStart(12, ' ')}`;
      };

      if (tarifaComMarkup) {
        res += formatValueLine('Tarifa Base USD (orig):', 'USD', tUSDOriginal) + '\n';
        res += formatValueLine(`Markup (${formData.markup}%):`, 'USD', tUSD - tUSDOriginal) + '\n';
        res += formatValueLine('Tarifa USD (c/ markup):', 'USD', tUSD) + '\n';
        res += formatValueLine('Tarifa BRL (c/ markup):', 'BRL', tBRL) + '\n';
      } else {
        res += formatValueLine('Tarifa Base (USD):', 'USD', tUSD) + '\n';
        res += formatValueLine('Tarifa BRL:', 'BRL', tBRL) + '\n';
      }
      
      res += formatValueLine('Taxas:', 'BRL', totalBRL - tBRL) + '\n';
      res += formatValueLine('Total Parcial:', 'BRL', totalBRL) + '\n';
      res += formatValueLine(`RAV (${formData.rav}%):`, 'BRL', ravVal) + '\n';
      res += formatValueLine('FEE:', 'BRL', feeVal) + '\n';
      res += '----------------------------------------\n';
      res += formatValueLine('TOTAL FINAL:', 'BRL', final) + '\n';
      res += '----------------------------------------\n';
      res += `Pagamento: ${formData.parcelamento}\n\n[ REGRAS E PENALIDADES ]\nReemissão: USD ${formData.multaReem || 'N/A'}\nReembolso: USD ${formData.multaReeb || 'N/A'}\n\n* Tarifa válida por 12 meses da data de emissão.`;

      setResult(res);

      // Save calculation
      try {
        await calculationService.saveCalculation('tarifa', gds, {
          inputText,
          formData
        }, res);
      } catch (err) {
        console.error('Erro ao salvar cálculo:', err);
      }

      toast({
        title: "Cálculo realizado!",
        description: "Tarifa calculada com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao processar tarifa. Verifique os dados.",
        variant: "destructive",
      });
    }
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(result);
    if (success) {
      toast({
        title: "Copiado!",
        description: "Resultado copiado para área de transferência.",
      });
    } else {
      toast({
        title: "Erro ao copiar",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="p-6" data-testid="tarifa-calculator">
      <h2 className="text-2xl font-bold mb-4">Cálculo de Tarifas</h2>

      {/* GDS Tabs */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={gds === 'amadeus' ? 'default' : 'outline'}
          onClick={() => setGds('amadeus')}
          size="sm"
        >
          AMADEUS
        </Button>
        <Button
          variant={gds === 'galileo' ? 'default' : 'outline'}
          onClick={() => setGds('galileo')}
          size="sm"
        >
          GALILEO
        </Button>
        <Button
          variant={gds === 'sabre' ? 'default' : 'outline'}
          onClick={() => setGds('sabre')}
          size="sm"
        >
          SABRE
        </Button>
      </div>

      {/* Roteiro Textarea */}
      <div className="mb-4">
        <Label>Roteiro / Linhas de Voo (GDS ou texto simples)</Label>
        <Textarea
          rows={3}
          placeholder="Cole as linhas de voo do GDS ou digite o roteiro simples (Ex: GRU/MIA/GRU)..."
          value={formData.roteiro}
          onChange={(e) => setFormData({ ...formData, roteiro: e.target.value })}
          className="font-mono text-sm"
          data-testid="roteiro-input"
        />
      </div>

      {/* Input Textarea */}
      <div className="mb-4">
        <Label>Cole a cotação aqui</Label>
        <Textarea
          rows={6}
          placeholder="Cole a cotação do GDS aqui..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="font-mono text-sm"
          data-testid="tarifa-input"
        />
      </div>

      {/* Form Inputs */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <Label>Voo / Cia</Label>
          <Input
            value={formData.voo}
            onChange={(e) => setFormData({ ...formData, voo: e.target.value })}
          />
        </div>
        <div>
          <Label>Cabine</Label>
          <Input
            value={formData.cabine}
            onChange={(e) => setFormData({ ...formData, cabine: e.target.value })}
          />
        </div>
        <div>
          <Label>Bagagem</Label>
          <Input
            value={formData.bagagem}
            onChange={(e) => setFormData({ ...formData, bagagem: e.target.value })}
          />
        </div>
        <div>
          <Label>FEE (BRL)</Label>
          <Input
            type="number"
            value={formData.fee}
            onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
          />
        </div>
        <div>
          <Label>RAV %</Label>
          <Input
            type="number"
            value={formData.rav}
            onChange={(e) => setFormData({ ...formData, rav: e.target.value })}
          />
        </div>
        <div>
          <Label>Parcelamento</Label>
          <Input
            value={formData.parcelamento}
            onChange={(e) => setFormData({ ...formData, parcelamento: e.target.value })}
          />
        </div>
        <div>
          <Label>Multa Reemissão (USD)</Label>
          <Input
            value={formData.multaReem}
            onChange={(e) => setFormData({ ...formData, multaReem: e.target.value })}
            placeholder="Antes / Depois"
          />
        </div>
        <div>
          <Label>Multa Reembolso (USD)</Label>
          <Input
            value={formData.multaReeb}
            onChange={(e) => setFormData({ ...formData, multaReeb: e.target.value })}
            placeholder="Antes / Depois"
          />
        </div>
      </div>

      {/* Markup Section */}
      <div className="border-t pt-4 mb-4">
        <div className="flex items-center gap-4 mb-3">
          <input
            type="checkbox"
            id="aplicarMarkup"
            checked={formData.aplicarMarkup}
            onChange={(e) => setFormData({ ...formData, aplicarMarkup: e.target.checked })}
            className="w-4 h-4"
          />
          <Label htmlFor="aplicarMarkup" className="cursor-pointer mb-0">
            Aplicar Markup (tarifas net-net sem parcelamento)
          </Label>
        </div>
        
        {formData.aplicarMarkup && (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Markup %</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.markup}
                onChange={(e) => setFormData({ ...formData, markup: e.target.value })}
                placeholder="Ex: 10"
              />
              <p className="text-xs text-gray-500 mt-1">
                Exemplo: 10% = divide por 0.90
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mb-4">
        <Button onClick={processarTarifa} data-testid="calcular-button">
          <CalcIcon className="mr-2 h-4 w-4" />
          GERAR
        </Button>
        <Button variant="outline" onClick={handleCopy} data-testid="copy-button">
          <Copy className="mr-2 h-4 w-4" />
          COPIAR
        </Button>
      </div>

      {/* Result Area */}
      <div className="bg-[#1a202c] text-green-400 p-4 rounded-md font-mono text-sm whitespace-pre-wrap" data-testid="tarifa-result">
        {result}
      </div>
    </Card>
  );
};

export default Tarifa;
