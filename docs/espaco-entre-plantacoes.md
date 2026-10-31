# Espaço visual dos canteiros

Configuração em public/plot-ground.js: `PLOT_VISUAL_SCALE = 0.92`. Pode ser ajustada também por `window.PLOT_VISUAL_SCALE`. O valor1 restaura a apresentação emendada. Não é salvo no estado da fazenda.

Transforma apenas o desenho de terra seca/arada e culturas, incluindo estágios inicial, intermediário, pronto e morto. Centro da transformação: centro do losango lógico. Reutiliza o mesmo desenho em estado normal, prévia de colocação e movimento. GIFs usam o compositor compartilhado com as dimensões visuais ajustadas. As pontes de solo entre canteiros só são desenhadas na escala1.

Não muda gx,gy,w,h, ocupação, colisão, progresso, salvamento, ordem de desenho, área de toque ou destaque lógico. Árvores, animais, construções e cercas não recebem a transformação. Seleção e fantasma da grade continuam inteiros.

Verificação: quatro canteiros adjacentes formam uma cruz de grama nas duas diagonais, mantendo toque nas margens2×2, snapshot intacto e escala consistente em terra seca/arada e estágios de cultura.
