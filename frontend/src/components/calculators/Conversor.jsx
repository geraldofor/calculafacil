import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Copy, ArrowRight } from 'lucide-react';
import { copyToClipboard } from '@/utils/formatters';
import { aeroDB, ciasDB } from '@/utils/gdsData';
import { calculationService } from '@/services/calculations';
import { useToast } from '@/hooks/use-toast';

const Conversor = () => {
  const { toast } = useToast();
  const [gds, setGds] = useState('sabre');
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState('Aguardando itinerário...');

  const converter = async () => {
    try {
      const raw = inputText.toUpperCase();
      const linhas = raw.split('\n');
      let voos = [];

      linhas.forEach((l) => {
        if (!l.trim()) return;

        let m = l.match(
          /(?:\d+\s+)?([A-Z0-9]{2})\s*(\d{1,5})\s*[A-Z]?\s+(\d{2}[A-Z]{3})\s*[1-7]?[\*]?\s*([A-Z]{3})([A-Z]{3})\s+([A-Z]{2}\d?)\s+[^0-9]*(\d{4})\s+(\d{4})/
        );

        if (m) {
          const cia = ciasDB[m[1]] || m[1];
          const org = aeroDB[m[4]]
            ? `${aeroDB[m[4]]} (${m[4]})`
            : `${m[4]} (${m[4]})`;
          const dst = aeroDB[m[5]]
            ? `${aeroDB[m[5]]} (${m[5]})`
            : `${m[5]} (${m[5]})`;
          const dep = `${m[7].slice(0, 2)}:${m[7].slice(2)}`;
          const arr = `${m[8].slice(0, 2)}:${m[8].slice(2)}`;

          voos.push({
            cia,
            numero: m[2],
            data: m[3] + '26',
            origem: org,
            destino: dst,
            partida: dep,
            chegada: arr,
          });
        }
      });

      if (voos.length === 0) {
        setResult('Formato não reconhecido.');
        toast({
          title: "Erro",
          description: "Formato de itinerário não reconhecido.",
          variant: "destructive",
        });
        return;
      }

      let maxOrigem = 0;
      let maxDestino = 0;

      voos.forEach((voo) => {
        if (voo.origem.length > maxOrigem) maxOrigem = voo.origem.length;
        if (voo.destino.length > maxDestino) maxDestino = voo.destino.length;
      });

      maxOrigem += 2;
      maxDestino += 2;

      let res = '';
      voos.forEach((voo) => {
        const origemFormatada = voo.origem.padEnd(maxOrigem);
        const destinoFormatada = voo.destino.padEnd(maxDestino);

        res += `${voo.cia} ${voo.numero} ➔ ${voo.data} ➔ ${origemFormatada}${voo.partida} ➔ ${destinoFormatada}${voo.chegada}\n`;
      });

      setResult(res);

      // Save calculation
      try {
        await calculationService.saveCalculation('conversor', gds, { inputText }, res);
      } catch (err) {
        console.error('Erro ao salvar cálculo:', err);
      }

      toast({
        title: "Conversão realizada!",
        description: "Itinerário convertido com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao processar itinerário.",
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
    <Card className="p-6" data-testid="conversor-calculator">
      <h2 className="text-2xl font-bold mb-4">Conversor de Itinerários</h2>

      {/* GDS Tabs */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={gds === 'sabre' ? 'default' : 'outline'}
          onClick={() => setGds('sabre')}
          size="sm"
        >
          SABRE
        </Button>
        <Button
          variant={gds === 'galileo' ? 'default' : 'outline'}
          onClick={() => setGds('galileo')}
          size="sm"
        >
          GALILEO
        </Button>
        <Button
          variant={gds === 'amadeus' ? 'default' : 'outline'}
          onClick={() => setGds('amadeus')}
          size="sm"
        >
          AMADEUS
        </Button>
      </div>

      {/* Input Textarea */}
      <div className="mb-4">
        <Label>Cole as linhas de voo aqui</Label>
        <Textarea
          rows={10}
          placeholder="Cole as linhas de voo do GDS aqui..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="font-mono text-sm"
          data-testid="conversor-input"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mb-4">
        <Button onClick={converter} data-testid="converter-button">
          <ArrowRight className="mr-2 h-4 w-4" />
          DECODIFICAR
        </Button>
        <Button variant="outline" onClick={handleCopy} data-testid="copy-button">
          <Copy className="mr-2 h-4 w-4" />
          COPIAR ZAP
        </Button>
      </div>

      {/* Result Area */}
      <div className="bg-[#1a202c] text-green-400 p-4 rounded-md font-mono text-sm whitespace-pre-wrap" data-testid="conversor-result">
        {result}
      </div>
    </Card>
  );
};

export default Conversor;
