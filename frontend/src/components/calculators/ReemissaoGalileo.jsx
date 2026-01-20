import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Upload, RefreshCw, AlertCircle } from 'lucide-react';
import { copyToClipboard, formatDate } from '@/utils/formatters';
import { calculationService } from '@/services/calculations';
import { useToast } from '@/hooks/use-toast';
import Tesseract from 'tesseract.js';

const ReemissaoGalileo = () => {
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState('Upload uma imagem do Galileo ou preencha os campos manualmente');
  
  const [formData, setFormData] = useState({
    netAddCollect: '',
    changeFee: '',
    oldBaseFareUSD: '',
    newBaseFareUSD: '',
    cotacao: '5.5410',
    feeUSD: '25.00',
    ravPercent: '7.00',
    ravMinimo: '200',
    passageiro: '',
    rota: '',
    loc: '',
    ticketOriginal: '',
    dataEmissao: new Date().toISOString().split('T')[0],
    aplicarMarkup: false,
    markup: '10',
  });

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setProcessing(true);
    toast({
      title: "Processando imagem...",
      description: "OCR em andamento. Aguarde.",
    });

    try {
      // Pré-processar imagem para melhor OCR
      const image = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0);

      // Aumentar contraste e converter para preto/branco
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const value = avg > 128 ? 255 : 0;
        data[i] = data[i + 1] = data[i + 2] = value;
      }
      
      ctx.putImageData(imageData, 0, 0);

      // OCR com Tesseract
      const { data: { text } } = await Tesseract.recognize(
        canvas.toDataURL(),
        'eng',
        {
          tessedit_char_whitelist: '0123456789.,BRLUSADT ',
          logger: (m) => console.log(m),
        }
      );

      // Extrair valores do texto OCR
      const extractedData = extractGalileoValues(text);
      
      setFormData(prev => ({
        ...prev,
        ...extractedData
      }));

      toast({
        title: "OCR Concluído!",
        description: "REVISE os valores antes de calcular.",
        variant: "default",
      });
    } catch (error) {
      console.error('Erro OCR:', error);
      toast({
        title: "Erro no OCR",
        description: "Preencha os campos manualmente.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const extractGalileoValues = (text) => {
    const extracted = {};
    
    // Net Add-Collect: BRL 7460.97
    const netMatch = text.match(/Net\s*Add[-\s]*Collect[:\s]*BRL\s*([\d,.]+)/i);
    if (netMatch) {
      extracted.netAddCollect = netMatch[1].replace(',', '');
    }

    // Change Fee: BRL 1609.59
    const changeMatch = text.match(/Change\s*Fee[:\s]*BRL\s*([\d,.]+)/i);
    if (changeMatch) {
      extracted.changeFee = changeMatch[1].replace(',', '');
    }

    // Old Base Fare: ADT USD 2335.00
    const oldMatch = text.match(/Base.*EQV.*Fare.*USD\s*([\d,.]+)/i) || 
                     text.match(/ADT\s*USD\s*([\d,.]+)/);
    if (oldMatch) {
      extracted.oldBaseFareUSD = oldMatch[1].replace(',', '');
    }

    // New Base Fare
    const newMatch = text.match(/New.*Base.*USD\s*([\d,.]+)/i);
    if (newMatch) {
      extracted.newBaseFareUSD = newMatch[1].replace(',', '');
    }

    return extracted;
  };

  const calcularReemissao = async () => {
    try {
      const netAddCollect = parseFloat(formData.netAddCollect.replace(',', '.')) || 0;
      const changeFee = parseFloat(formData.changeFee.replace(',', '.')) || 0;
      let oldBaseFareUSD = parseFloat(formData.oldBaseFareUSD.replace(',', '.')) || 0;
      let newBaseFareUSD = parseFloat(formData.newBaseFareUSD.replace(',', '.')) || 0;
      const cotacao = parseFloat(formData.cotacao.replace(',', '.'));
      const feeUSD = parseFloat(formData.feeUSD.replace(',', '.'));
      const ravPercent = parseFloat(formData.ravPercent.replace(',', '.')) / 100;
      const ravMinimo = parseFloat(formData.ravMinimo.replace(',', '.'));

      if (!netAddCollect || !cotacao) {
        toast({
          title: "Erro",
          description: "Preencha Net Add-Collect e Cotação",
          variant: "destructive",
        });
        return;
      }

      // APLICAR MARKUP se ativo
      let oldBaseFareUSDOriginal = oldBaseFareUSD;
      let newBaseFareUSDOriginal = newBaseFareUSD;
      let tarifaComMarkup = false;
      
      if (formData.aplicarMarkup && parseFloat(formData.markup) > 0) {
        const markupPercent = parseFloat(formData.markup);
        
        if (oldBaseFareUSD > 0) {
          oldBaseFareUSD = oldBaseFareUSD / (1 - markupPercent / 100);
        }
        if (newBaseFareUSD > 0) {
          newBaseFareUSD = newBaseFareUSD / (1 - markupPercent / 100);
        }
        
        tarifaComMarkup = true;
      }

      // Cálculo diferença de tarifa
      const fareBalanceUSD = newBaseFareUSD - oldBaseFareUSD;
      const fareBalanceBRL = fareBalanceUSD * cotacao;

      // Cálculos
      const feeBRL = feeUSD * cotacao;
      
      let ravVal = 0;
      if (fareBalanceBRL > 0) {
        ravVal = fareBalanceBRL * ravPercent;
        if (ravVal < ravMinimo) ravVal = ravMinimo;
      }

      const totalPorPax = fareBalanceBRL + changeFee + feeBRL + ravVal;

      // Formatar saída
      const dataExibicao = formatDate(formData.dataEmissao);
      const feeUSDFormatted = feeUSD.toFixed(2).replace('.', ',');
      const ravPercentDisplay = (ravPercent * 100).toFixed(0);

      const formatVal = (val) => {
        if (Math.abs(val) < 0.01) return '0,00';
        return val.toFixed(2).replace('.', ',');
      };

      const pad = 12;

      let outputText = '';
      outputText += `       CÁLCULO DE REMARCAÇÃO - GALILEO\n`;
      outputText += `       Data: ${dataExibicao}\n`;
      outputText += `       Cotação USD: R$ ${cotacao.toFixed(4).replace('.', ',')}\n`;
      outputText += `       FEE: U$ ${feeUSDFormatted}\n`;
      
      if (tarifaComMarkup) {
        outputText += `       MARKUP: ${formData.markup}% aplicado\n`;
        outputText += `       OLD FARE: USD ${oldBaseFareUSDOriginal.toFixed(2)} → USD ${oldBaseFareUSD.toFixed(2)}\n`;
        outputText += `       NEW FARE: USD ${newBaseFareUSDOriginal.toFixed(2)} → USD ${newBaseFareUSD.toFixed(2)}\n`;
      }
      
      outputText += `       ---------------------------------------\n\n`;

      if (formData.passageiro) {
        outputText += `PASSAGEIRO: ${formData.passageiro}\n`;
      }
      if (formData.rota) {
        outputText += `ROTA: ${formData.rota}\n`;
      }
      if (formData.loc) {
        outputText += `LOC.: ${formData.loc}\n`;
      }
      if (formData.ticketOriginal) {
        outputText += `TICKET ORIGINAL: ${formData.ticketOriginal}\n`;
      }
      
      outputText += `----------------------------------------\n\n`;

      outputText += `Diferença de tarifa (R$)     R$ ${formatVal(fareBalanceBRL).padStart(pad)}\n`;
      outputText += `Multa (Change Fee)           R$ ${formatVal(changeFee).padStart(pad)}\n`;
      outputText += `FEE                          R$ ${formatVal(feeBRL).padStart(pad)}\n`;
      
      if (ravVal > 0) {
        outputText += `RAV - ${ravPercentDisplay}%                     R$ ${formatVal(ravVal).padStart(pad)}\n`;
      }
      
      outputText += `----------------------------------------\n`;
      outputText += `TOTAL POR PAX                R$ ${formatVal(totalPorPax).padStart(pad)}\n`;
      outputText += `========================================\n`;
      outputText += `\nCONFERÊNCIA GALILEO:\n`;
      outputText += `NET ADD-COLLECT (GDS)        R$ ${formatVal(netAddCollect).padStart(pad)}\n`;
      outputText += `========================================\n`;
      outputText += `***VALORES POR PAX SUJEITOS A ALTERAÇÃO***\n`;
      outputText += `* Emissão: ${dataExibicao}`;

      setResult(outputText);

      // Salvar cálculo
      try {
        await calculationService.saveCalculation('reemissao', 'galileo', {
          formData
        }, outputText);
      } catch (err) {
        console.error('Erro ao salvar cálculo:', err);
      }

      toast({
        title: "Cálculo realizado!",
        description: "Reemissão Galileo calculada com sucesso.",
      });
    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar reemissão.",
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
    }
  };

  const limpar = () => {
    setFormData({
      ...formData,
      netAddCollect: '',
      changeFee: '',
      oldBaseFareUSD: '',
      newBaseFareUSD: '',
      passageiro: '',
      rota: '',
      loc: '',
      ticketOriginal: '',
      dataEmissao: new Date().toISOString().split('T')[0],
      aplicarMarkup: false,
    });
    setResult('Upload uma imagem do Galileo ou preencha os campos manualmente');
  };

  return (
    <div>
      <Card className="p-6 mb-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900">OCR + Revisão Manual</h3>
            <p className="text-sm text-blue-800 mt-1">
              <strong>1.</strong> Faça upload da imagem do Galileo (Automated Exchanges)<br/>
              <strong>2.</strong> Sistema extrai valores automaticamente (70-85% precisão)<br/>
              <strong>3.</strong> <strong className="text-red-600">REVISE</strong> todos os valores nos campos abaixo<br/>
              <strong>4.</strong> Corrija se necessário e clique em CALCULAR
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6" data-testid="reemissao-galileo">
        <h2 className="text-2xl font-bold mb-4">Reemissão - Galileo (OCR)</h2>

        {/* Upload de Imagem */}
        <div className="mb-6">
          <Label>Upload da Imagem (Automated Exchanges)</Label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={processing}
            className="w-full"
            variant="outline"
          >
            {processing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Processando OCR...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Printscreen do Galileo
              </>
            )}
          </Button>
          <p className="text-xs text-gray-500 mt-1">
            PNG, JPG ou qualquer imagem. OCR irá extrair os valores.
          </p>
        </div>

        {/* Campos Extraídos / Editáveis - Row 1 */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>
            <Label>Net Add-Collect (BRL) *</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.netAddCollect}
              onChange={(e) => setFormData({ ...formData, netAddCollect: e.target.value })}
              placeholder="7460.97"
              className="font-mono"
            />
          </div>
          <div>
            <Label>Change Fee (BRL)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.changeFee}
              onChange={(e) => setFormData({ ...formData, changeFee: e.target.value })}
              placeholder="1609.59"
              className="font-mono"
            />
          </div>
          <div>
            <Label>Old Base Fare (USD)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.oldBaseFareUSD}
              onChange={(e) => setFormData({ ...formData, oldBaseFareUSD: e.target.value })}
              placeholder="2335.00"
              className="font-mono"
            />
          </div>
          <div>
            <Label>New Base Fare (USD)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.newBaseFareUSD}
              onChange={(e) => setFormData({ ...formData, newBaseFareUSD: e.target.value })}
              placeholder="3685.00"
              className="font-mono"
            />
          </div>
        </div>

        {/* Configurações - Row 2 */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>
            <Label>Cotação do Dólar (R$) *</Label>
            <Input
              type="number"
              step="0.0001"
              value={formData.cotacao}
              onChange={(e) => setFormData({ ...formData, cotacao: e.target.value })}
            />
          </div>
          <div>
            <Label>FEE (USD)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.feeUSD}
              onChange={(e) => setFormData({ ...formData, feeUSD: e.target.value })}
            />
          </div>
          <div>
            <Label>% RAV</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.ravPercent}
              onChange={(e) => setFormData({ ...formData, ravPercent: e.target.value })}
            />
          </div>
          <div>
            <Label>RAV Mínimo (R$)</Label>
            <Input
              type="number"
              value={formData.ravMinimo}
              onChange={(e) => setFormData({ ...formData, ravMinimo: e.target.value })}
            />
          </div>
        </div>

        {/* Dados Adicionais - Row 3 */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>
            <Label>Passageiro</Label>
            <Input
              value={formData.passageiro}
              onChange={(e) => setFormData({ ...formData, passageiro: e.target.value })}
              placeholder="Nome completo"
            />
          </div>
          <div>
            <Label>Rota</Label>
            <Input
              value={formData.rota}
              onChange={(e) => setFormData({ ...formData, rota: e.target.value })}
              placeholder="GRU-LIS"
            />
          </div>
          <div>
            <Label>LOC</Label>
            <Input
              value={formData.loc}
              onChange={(e) => setFormData({ ...formData, loc: e.target.value })}
              placeholder="ABC123"
              className="font-mono"
            />
          </div>
          <div>
            <Label>Ticket Original</Label>
            <Input
              value={formData.ticketOriginal}
              onChange={(e) => setFormData({ ...formData, ticketOriginal: e.target.value })}
              placeholder="123456789"
            />
          </div>
        </div>

        {/* Data */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>
            <Label>Data</Label>
            <Input
              type="date"
              value={formData.dataEmissao}
              onChange={(e) => setFormData({ ...formData, dataEmissao: e.target.value })}
            />
          </div>
        </div>

        {/* Markup Section */}
        <div className="border-t pt-4 mb-4">
          <div className="flex items-center gap-4 mb-3">
            <input
              type="checkbox"
              id="aplicarMarkupGalileo"
              checked={formData.aplicarMarkup}
              onChange={(e) => setFormData({ ...formData, aplicarMarkup: e.target.checked })}
              className="w-4 h-4"
            />
            <Label htmlFor="aplicarMarkupGalileo" className="cursor-pointer mb-0">
              Aplicar Markup na tarifa
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
              </div>
            </div>
          )}
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-2 mb-4">
          <Button onClick={calcularReemissao} data-testid="calcular-button">
            <Upload className="mr-2 h-4 w-4" />
            CALCULAR
          </Button>
          <Button variant="outline" onClick={handleCopy} data-testid="copy-button">
            <Copy className="mr-2 h-4 w-4" />
            COPIAR
          </Button>
          <Button variant="outline" onClick={limpar} data-testid="clear-button">
            <RefreshCw className="mr-2 h-4 w-4" />
            LIMPAR
          </Button>
        </div>

        {/* Resultado */}
        <div className="bg-[#1a202c] text-green-400 p-4 rounded-md font-mono text-sm whitespace-pre-wrap" data-testid="galileo-result">
          {result}
        </div>
      </Card>
    </div>
  );
};

export default ReemissaoGalileo;
