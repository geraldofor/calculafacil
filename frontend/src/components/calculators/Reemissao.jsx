import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Calculator as CalcIcon, Trash2 } from 'lucide-react';
import { copyToClipboard, formatDate } from '@/utils/formatters';
import { calculationService } from '@/services/calculations';
import { useToast } from '@/hooks/use-toast';

const Reemissao = () => {
  const { toast } = useToast();
  const [gds, setGds] = useState('amadeus');
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState('Cole o resumo Amadeus (ET*) e clique em CALCULAR');

  const [formData, setFormData] = useState({
    cotacao: '5.5410',
    feeUSD: '25.00',
    ravPercent: '7.00',
    ravMinimo: '200',
    ticketOriginal: '',
    passageiro: '',
    passageiros: '',
    rota: '',
    roteiro: '',
    loc: '',
    dataEmissao: new Date().toISOString().split('T')[0],
    aplicarMarkup: false,
    markup: '10',
  });

  const processarReemissaoAmadeus = async () => {
    try {
      const texto = inputText.trim().toUpperCase();
      const cotacao = parseFloat(formData.cotacao.replace(',', '.'));
      const feeUSD = parseFloat(formData.feeUSD.replace(',', '.'));
      const ravPercent = parseFloat(formData.ravPercent.replace(',', '.')) / 100;
      const ravMinimo = parseFloat(formData.ravMinimo.replace(',', '.'));

      if (!texto) {
        toast({
          title: "Erro",
          description: "Por favor, cole o resumo Amadeus (ET*)",
          variant: "destructive",
        });
        return;
      }

      if (!cotacao || cotacao <= 0) {
        toast({
          title: "Erro",
          description: "Insira uma cotação válida do dólar",
          variant: "destructive",
        });
        return;
      }

      // EXPRESSÕES REGULARES PARA AMADEUS
      const patterns = {
        fareBalanceBRL: /FARE\s+BALANCE\s+BRL\s+([\-\d,.]+)/i,
        taxBalanceBRL: /TAX\s+BALANCE\s+BRL\s+([\-\d,.]+)/i,
        residualValueBRL: /RESIDUAL\s+VALUE\s+BRL\s+([\-\d,.]+)/i,
        penaltyBRL: /PENALTY\s+BRL\s+([\-\d,.]+)/i,
        ticketDifferenceBRL: /TICKET\s+DIFFERENCE\s+BRL\s+([\-\d,.]+)/i,
        totalAddCollBRL: /TOTAL\s+ADD\s+COLL\s+BRL\s+([\-\d,.]+)/i,
        nonRefundableTaxBRL: /NON\s+REFUNDABLE\s+TAX\s+BRL\s+([\-\d,.]+)/i,
      };

      const extractValueAmadeus = (pattern) => {
        const match = texto.match(pattern);
        if (match && match[1]) {
          let value = match[1].trim();
          value = value.replace(/,/g, '');
          const parsed = parseFloat(value);
          return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
      };

      // EXTRAIR VALORES
      const fareBalanceBRL = extractValueAmadeus(patterns.fareBalanceBRL);
      const taxBalanceBRL = extractValueAmadeus(patterns.taxBalanceBRL);
      const residualValueBRL = extractValueAmadeus(patterns.residualValueBRL);
      const penaltyBRL = extractValueAmadeus(patterns.penaltyBRL);
      const ticketDifferenceBRL = extractValueAmadeus(patterns.ticketDifferenceBRL);
      const totalAddColBRL = extractValueAmadeus(patterns.totalAddCollBRL);
      const nonRefundableTaxBRL = extractValueAmadeus(patterns.nonRefundableTaxBRL);

      // CÁLCULOS
      let baseCalculoBRL = fareBalanceBRL;
      if (Math.abs(fareBalanceBRL) < 0.01 && ticketDifferenceBRL > 0) {
        baseCalculoBRL = ticketDifferenceBRL;
      }

      let difTaxasCalculada = taxBalanceBRL;
      if (residualValueBRL < 0) {
        difTaxasCalculada = taxBalanceBRL + Math.abs(residualValueBRL);
      }

      let totalAddCollectGDS = 0;
      if (Math.abs(totalAddColBRL) > 0.01) {
        totalAddCollectGDS = totalAddColBRL;
      } else {
        const ticketDiff = ticketDifferenceBRL > 0 ? ticketDifferenceBRL : taxBalanceBRL;
        totalAddCollectGDS = ticketDiff + penaltyBRL + Math.abs(residualValueBRL);
      }

      const feeBRL = feeUSD * cotacao;

      let ravVal = 0;
      if (baseCalculoBRL > 0) {
        ravVal = baseCalculoBRL * ravPercent;
        if (ravVal < ravMinimo) ravVal = ravMinimo;
      }

      const totalPorPax = baseCalculoBRL + difTaxasCalculada + penaltyBRL + feeBRL + ravVal;

      const totalAddCollectCalculado = baseCalculoBRL + difTaxasCalculada + penaltyBRL;
      const diffValidacao = Math.abs(totalAddCollectCalculado - totalAddCollectGDS);

      const ravPercentDisplay = (ravPercent * 100).toFixed(0);
      const feeUSDFormatted = feeUSD.toFixed(2).replace('.', ',');

      const dataExibicao = formatDate(formData.dataEmissao);

      const formatVal = (val) => {
        if (Math.abs(val) < 0.01) return '0,00';
        return val.toFixed(2).replace('.', ',');
      };

      const pad = 12;

      let outputText = '';
      outputText += `       CÁLCULO DE REMARCAÇÃO - ADT\n`;
      outputText += `       Data: ${dataExibicao}\n`;
      outputText += `       Cotação USD: R$ ${cotacao.toFixed(4).replace('.', ',')}\n`;
      outputText += `       FEE: U$ ${feeUSDFormatted}\n`;
      outputText += `       ---------------------------------------\n\n`;

      // PASSAGEIROS (múltiplos - novo formato)
      if (formData.passageiros && formData.passageiros.trim()) {
        const linhasPassageiros = formData.passageiros.trim().split('\n');
        outputText += `PASSAGEIRO:  ${linhasPassageiros[0]}\n`;
        for (let i = 1; i < linhasPassageiros.length; i++) {
          outputText += `             ${linhasPassageiros[i]}\n`;
        }
        outputText += `\n`;
      } else if (formData.passageiro) {
        // Fallback para campo antigo
        outputText += `PASSAGEIRO: ${formData.passageiro}\n\n`;
      }

      // ROTEIRO (múltiplas linhas - novo formato)
      if (formData.roteiro && formData.roteiro.trim()) {
        const linhasRoteiro = formData.roteiro.trim().split('\n');
        outputText += `ROTA:   ${linhasRoteiro[0]}\n`;
        for (let i = 1; i < linhasRoteiro.length; i++) {
          outputText += `        ${linhasRoteiro[i]}\n`;
        }
        outputText += `\n`;
      } else if (formData.rota) {
        // Fallback para campo antigo
        outputText += `ROTA: ${formData.rota}\n\n`;
      }

      // LOC
      if (formData.loc) {
        outputText += `LOC.: ${formData.loc}\n `;
      }

      // TICKET ORIGINAL
      if (formData.ticketOriginal) {
        outputText += `\nTICKET ORIGINAL: ${formData.ticketOriginal}\n`;
      }
      
      outputText += `----------------------------------------\n\n`;

      outputText += `Diferença de tarifa (R$)     R$ ${formatVal(baseCalculoBRL).padStart(pad)}\n`;
      outputText += `Diferença de taxas           R$ ${formatVal(difTaxasCalculada).padStart(pad)}\n`;
      outputText += `Multa                        R$ ${formatVal(penaltyBRL).padStart(pad)}\n`;
      outputText += `FEE                          R$ ${formatVal(feeBRL).padStart(pad)}\n`;

      if (ravVal > 0) {
        outputText += `RAV - ${ravPercentDisplay}%                     R$ ${formatVal(ravVal).padStart(pad)}\n`;
      }

      outputText += `----------------------------------------\n`;
      outputText += `TOTAL POR PAX                R$ ${formatVal(totalPorPax).padStart(pad)}\n`;
      outputText += `========================================\n`;
      outputText += `***VALORES POR PAX SUJEITOS A ALTERAÇÃO***\n\n`;

      outputText += `\nCONFERÊNCIA GDS:\n`;
      outputText += `TICKET DIFFERENCE            R$ ${formatVal(ticketDifferenceBRL).padStart(pad)}\n`;
      outputText += `PENALTY                      R$ ${formatVal(penaltyBRL).padStart(pad)}\n`;

      if (residualValueBRL < 0) {
        outputText += `RESIDUAL (abs)               R$ ${formatVal(Math.abs(residualValueBRL)).padStart(pad)}\n`;
        outputText += `----------------------------------------\n`;
        outputText += `TOTAL ADD COLL (GDS)         R$ ${formatVal(totalAddCollectGDS).padStart(pad)}\n`;

        if (diffValidacao < 0.01) {
          outputText += `✅ VALIDAÇÃO: BATE COM O GDS\n`;
        } else {
          outputText += `⚠️  DIFERENÇA: R$ ${formatVal(diffValidacao)}\n`;
        }
      }

      outputText += `========================================\n`;

      if (residualValueBRL < 0) {
        outputText += `* Taxas incluem compensação de residual negativo\n`;
      }
      if (nonRefundableTaxBRL > 0) {
        outputText += `* Non Refundable Tax (R$ ${formatVal(nonRefundableTaxBRL)}) não entra no cálculo\n`;
      }

      outputText += `Total Add Collect (CDS):     R$ ${formatVal(totalAddCollectGDS).padStart(10)}\n`;
      outputText += `***VALORES POR PAX SUJEITOS A ALTERAÇÃO***\n`;
      outputText += `* Emissão: ${dataExibicao}`;

      setResult(outputText);

      // Save calculation
      try {
        await calculationService.saveCalculation('reemissao', gds, {
          inputText,
          formData
        }, outputText);
      } catch (err) {
        console.error('Erro ao salvar cálculo:', err);
      }

      toast({
        title: "Cálculo realizado!",
        description: "Reemissão calculada com sucesso.",
      });
    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar reemissão. Verifique os dados.",
        variant: "destructive",
      });
    }
  };

  const limparReemissao = () => {
    setInputText('');
    setFormData({
      ...formData,
      ticketOriginal: '',
      passageiro: '',
      passageiros: '',
      rota: '',
      roteiro: '',
      loc: '',
      dataEmissao: new Date().toISOString().split('T')[0],
      aplicarMarkup: false,
    });
    setResult('Cole o resumo Amadeus (ET*) e clique em CALCULAR');
    toast({
      title: "Formulário limpo",
    });
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
    <Card className="p-6" data-testid="reemissao-calculator">
      <h2 className="text-2xl font-bold mb-4">Comparação de Bilhetes - Reemissão</h2>

      {/* GDS Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <Button
          variant={gds === 'amadeus' ? 'default' : 'outline'}
          onClick={() => setGds('amadeus')}
          size="sm"
        >
          AMADEUS
        </Button>
        <Button variant="outline" size="sm" disabled>
          SABRE (em breve)
        </Button>
        <Button variant="outline" size="sm" disabled>
          GALILEO (em breve)
        </Button>
      </div>

      {/* Input Textarea */}
      <div className="mb-4">
        <Label>Resumo Amadeus - ET* (Formato: 795.00, 1,234.56, -24.00)</Label>
        <Textarea
          rows={8}
          placeholder="Cole o conteúdo do resumo ET* aqui...&#10;&#10;Exemplo de formato AMADEUS (ponto = decimal):&#10;OLD BASE FARE       USD       795.00&#10;NEW BASE FARE       USD       795.00&#10;FARE BALANCE        BRL         0.00&#10;..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="font-mono text-sm"
          data-testid="reemissao-input"
        />
      </div>

      {/* Form Inputs - Row 1 */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div>
          <Label>Cotação do Dólar (R$)</Label>
          <Input
            type="number"
            step="0.0001"
            value={formData.cotacao}
            onChange={(e) => setFormData({ ...formData, cotacao: e.target.value })}
            placeholder="Ex: 5.5410"
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

      {/* Form Inputs - Row 2 */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div>
          <Label>Ticket Original</Label>
          <Input
            value={formData.ticketOriginal}
            onChange={(e) => setFormData({ ...formData, ticketOriginal: e.target.value })}
            placeholder="Número do bilhete"
          />
        </div>
        <div>
          <Label>Passageiro (simples)</Label>
          <Input
            value={formData.passageiro}
            onChange={(e) => setFormData({ ...formData, passageiro: e.target.value })}
            placeholder="Nome completo"
          />
          <p className="text-xs text-gray-500 mt-1">Use campo abaixo para múltiplos</p>
        </div>
        <div>
          <Label>Rota (simples)</Label>
          <Input
            value={formData.rota}
            onChange={(e) => setFormData({ ...formData, rota: e.target.value })}
            placeholder="Ex: GRU-MIA-JFK"
          />
          <p className="text-xs text-gray-500 mt-1">Use campo abaixo para roteiro completo</p>
        </div>
        <div>
          <Label>Data</Label>
          <Input
            type="date"
            value={formData.dataEmissao}
            onChange={(e) => setFormData({ ...formData, dataEmissao: e.target.value })}
          />
        </div>
      </div>

      {/* Form Inputs - Row 3 (Passageiros Múltiplos + Roteiro + LOC) */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <Label>Passageiros (múltiplos)</Label>
          <Textarea
            rows={3}
            value={formData.passageiros}
            onChange={(e) => setFormData({ ...formData, passageiros: e.target.value })}
            placeholder="1.SOBRENOME/NOME TITLE&#10;2.SOBRENOME/NOME TITLE"
            className="text-sm font-mono"
          />
        </div>
        <div>
          <Label>Roteiro (voos GDS)</Label>
          <Textarea
            rows={3}
            value={formData.roteiro}
            onChange={(e) => setFormData({ ...formData, roteiro: e.target.value })}
            placeholder="3  LA8084 L 23JAN 5 GRULHR HK2  2340 1405+1&#10;4  LX 317 H 27JAN 2 LHRZRH HK2  0900 1155"
            className="text-sm font-mono"
          />
        </div>
        <div>
          <Label>LOC (Localizador)</Label>
          <Input
            value={formData.loc}
            onChange={(e) => setFormData({ ...formData, loc: e.target.value })}
            placeholder="Ex: B2C7JN"
            className="font-mono"
          />
        </div>
      </div>

      {/* Markup Section */}
      <div className="border-t pt-4 mb-4">
        <div className="flex items-center gap-4 mb-3">
          <input
            type="checkbox"
            id="aplicarMarkupReem"
            checked={formData.aplicarMarkup}
            onChange={(e) => setFormData({ ...formData, aplicarMarkup: e.target.checked })}
            className="w-4 h-4"
          />
          <Label htmlFor="aplicarMarkupReem" className="cursor-pointer mb-0">
            Aplicar Markup na tarifa (tarifas net-net)
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
                Aplica fórmula: tarifa ÷ (1 - markup%)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Form Inputs - Row 3 (New Multi-line Fields) */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <Label>Passageiros (múltiplos)</Label>
          <Textarea
            rows={3}
            value={formData.passageiros}
            onChange={(e) => setFormData({ ...formData, passageiros: e.target.value })}
            placeholder="Nome 1&#10;Nome 2&#10;Nome 3..."
            className="text-sm"
          />
        </div>
        <div>
          <Label>Roteiro (múltiplas linhas)</Label>
          <Textarea
            rows={3}
            value={formData.roteiro}
            onChange={(e) => setFormData({ ...formData, roteiro: e.target.value })}
            placeholder="GRU-MIA 10JAN&#10;MIA-JFK 10JAN&#10;JFK-MIA 20JAN..."
            className="text-sm"
          />
        </div>
        <div>
          <Label>LOC</Label>
          <Input
            value={formData.loc}
            onChange={(e) => setFormData({ ...formData, loc: e.target.value })}
            placeholder="Localizador"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mb-4">
        <Button onClick={processarReemissaoAmadeus} data-testid="calcular-button">
          <CalcIcon className="mr-2 h-4 w-4" />
          CALCULAR
        </Button>
        <Button variant="outline" onClick={handleCopy} data-testid="copy-button">
          <Copy className="mr-2 h-4 w-4" />
          COPIAR
        </Button>
        <Button variant="outline" onClick={limparReemissao} data-testid="clear-button">
          <Trash2 className="mr-2 h-4 w-4" />
          LIMPAR
        </Button>
      </div>

      {/* Result Area */}
      <div className="bg-[#1a202c] text-green-400 p-4 rounded-md font-mono text-sm whitespace-pre-wrap" data-testid="reemissao-result">
        {result}
      </div>
    </Card>
  );
};

export default Reemissao;
