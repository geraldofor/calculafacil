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

const Tarifa = () => {
  const { toast } = useToast();
  const [gds, setGds] = useState('amadeus');
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState('Aguardando dados...');
  
  const [formData, setFormData] = useState({
    voo: 'Tap',
    cabine: 'ECONOMY STANDARD',
    bagagem: 'No Bag',
    fee: '150',
    rav: '7',
    multaReem: '',
    multaReeb: '',
    parcelamento: '10x sem juros',
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

      const ravVal = tBRL * (parseFloat(formData.rav) / 100);
      const feeVal = parseFloat(formData.fee || 0);
      const final = totalBRL + ravVal + feeVal;

      let res = `Cia/Voo: ${formData.voo}\nCabine: ${formData.cabine}\nBagagem: ${formData.bagagem}\n-------------------------------------------\n`;
      res += `Tarifa Base (USD):  USD ${tUSD.toFixed(2).padStart(12)}\nTarifa BRL:         BRL ${tBRL.toFixed(2).padStart(12)}\nTaxas:              BRL ${(totalBRL - tBRL).toFixed(2).padStart(12)}\nTotal Parcial:      BRL ${totalBRL.toFixed(2).padStart(12)}\nRAV (${formData.rav}%):          BRL ${ravVal.toFixed(2).padStart(12)}\nFEE:                BRL ${feeVal.toFixed(2).padStart(12)}\n-------------------------------------------\nTOTAL FINAL:        BRL ${final.toFixed(2).padStart(12)}\n-------------------------------------------\nPagamento: ${formData.parcelamento}\n\n[ REGRAS E PENALIDADES ]\nReemissão: USD ${formData.multaReem || 'N/A'}\nReembolso: USD ${formData.multaReeb || 'N/A'}\n\n* Tarifa válida por 12 meses da data de emissão.`;

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
