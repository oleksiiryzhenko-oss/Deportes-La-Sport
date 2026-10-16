import type { MaterialCommunityIcons } from '@expo/vector-icons';

export interface Rule {
  id: string;
  title: string;
  summary: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  points: string[];
}

export const RULES: Rule[] = [
  {
    id: 'campo',
    title: 'O campo e a bola',
    summary: 'Medidas do campo, balizas e áreas',
    icon: 'soccer-field',
    points: [
      'Comprimento entre 90 e 120 m e largura entre 45 e 90 m (em jogos internacionais: 100–110 m × 64–75 m).',
      'A baliza mede 7,32 m de largura e 2,44 m de altura.',
      'A grande área estende-se 16,5 m a partir de cada poste e 16,5 m para dentro do campo; a pequena área, 5,5 m.',
      'A marca de penálti fica a 11 m da linha de baliza e o círculo central tem 9,15 m de raio.',
      'A bola oficial (tamanho 5) tem entre 68 e 70 cm de perímetro.',
    ],
  },
  {
    id: 'jogadores',
    title: 'Jogadores e substituições',
    summary: 'Quantos jogam e quantas trocas',
    icon: 'account-group',
    points: [
      'Cada equipa tem no máximo 11 jogadores em campo, um deles guarda-redes.',
      'O jogo não pode começar nem continuar se uma equipa tiver menos de 7 jogadores.',
      'O número de substituições é definido pelo regulamento da competição; em muitas competições oficiais são permitidas até cinco.',
      'Um jogador substituído não pode voltar a entrar, exceto onde o regulamento permita substituições de retorno (comum no futebol de formação, veteranos e amador).',
    ],
  },
  {
    id: 'duracao',
    title: 'Duração do jogo',
    summary: 'Partes, intervalo e prolongamento',
    icon: 'timer-outline',
    points: [
      'Duas partes de 45 minutos, com um intervalo de até 15 minutos.',
      'O árbitro acrescenta tempo de compensação por substituições, lesões, perdas de tempo e outras paragens.',
      'Se for preciso um vencedor: prolongamento de 2 × 15 minutos e, se necessário, pontapés da marca de penálti.',
      'Durações mais curtas podem ser usadas (por exemplo, no futebol jovem) se o regulamento o permitir.',
    ],
  },
  {
    id: 'golo',
    title: 'Golo',
    summary: 'Quando a bola conta como golo',
    icon: 'soccer',
    points: [
      'É golo quando a bola ultrapassa totalmente a linha de baliza, entre os postes e por baixo da barra.',
      'Ganha a equipa que marcar mais golos; com o mesmo número de golos, o jogo termina empatado.',
      'Não se pode marcar golo diretamente de um lançamento lateral.',
      'De um pontapé de baliza ou de um pontapé de canto pode marcar-se golo diretamente na baliza adversária.',
    ],
  },
  {
    id: 'fora-de-jogo',
    title: 'Fora de jogo',
    summary: 'A regra mais discutida do futebol',
    icon: 'flag-variant',
    points: [
      'Um jogador está em posição de fora de jogo se estiver no meio-campo adversário e mais perto da linha de baliza adversária do que a bola e o penúltimo adversário.',
      'Estar em linha com o penúltimo adversário ou com a bola não é fora de jogo. Os braços e as mãos não contam.',
      'Estar em posição de fora de jogo não é, por si só, infração: só é punido se o jogador participar ativamente no lance (jogar a bola, interferir com um adversário ou tirar vantagem da posição).',
      'Não há fora de jogo quando se recebe a bola diretamente de um pontapé de baliza, lançamento lateral ou pontapé de canto.',
      'Sanção: livre indireto no local da infração.',
    ],
  },
  {
    id: 'faltas',
    title: 'Faltas e livres',
    summary: 'Livre direto, indireto e vantagem',
    icon: 'whistle',
    points: [
      'Livre direto: pontapear, rasteirar, empurrar, carregar, saltar sobre ou fazer uma entrada sobre um adversário de forma imprudente, temerária ou com força excessiva; segurar um adversário; tocar deliberadamente a bola com a mão ou o braço; morder ou cuspir.',
      'Livre indireto: jogo perigoso, obstruir um adversário sem contacto, impedir o guarda-redes de largar a bola, entre outras infrações.',
      'Se o guarda-redes segurar a bola nas mãos mais de 8 segundos, é assinalado pontapé de canto a favor da equipa adversária.',
      'Num livre, os adversários têm de ficar a pelo menos 9,15 m da bola.',
      'Lei da vantagem: o árbitro pode deixar seguir o jogo se isso beneficiar a equipa que sofreu a falta.',
    ],
  },
  {
    id: 'penalti',
    title: 'Penálti',
    summary: 'Como e quando se marca',
    icon: 'bullseye-arrow',
    points: [
      'É assinalado quando um jogador comete, dentro da própria grande área, uma infração punível com livre direto.',
      'Marca-se a partir da marca de penálti, a 11 m da baliza, e a bola tem de ser pontapeada para a frente.',
      'O guarda-redes fica sobre a linha de baliza, entre os postes; no momento do remate tem de ter pelo menos parte de um pé a tocar ou em linha com a linha de baliza.',
      'Os restantes jogadores ficam fora da grande área, atrás da marca de penálti e a pelo menos 9,15 m da bola.',
    ],
  },
  {
    id: 'cartoes',
    title: 'Cartões',
    summary: 'Advertências e expulsões',
    icon: 'cards',
    points: [
      'Cartão amarelo (advertência): comportamento antidesportivo, protestos, infrações persistentes, atrasar o reinício do jogo, não respeitar a distância num livre ou canto, entrar ou sair do campo sem autorização.',
      'Cartão vermelho (expulsão): falta grosseira, conduta violenta, cuspir ou morder, evitar um golo ou uma clara oportunidade de golo com a mão (exceto o guarda-redes na sua área), anular uma clara oportunidade de golo com uma falta (com exceções dentro da área), linguagem ou gestos ofensivos.',
      'Dois cartões amarelos no mesmo jogo resultam em expulsão.',
      'Um jogador expulso não pode ser substituído: a equipa fica a jogar com menos um.',
    ],
  },
  {
    id: 'reinicios',
    title: 'Reinícios de jogo',
    summary: 'Lançamento, canto, pontapé de baliza',
    icon: 'restart',
    points: [
      'Lançamento lateral: quando a bola sai pela linha lateral. Executa-se com as duas mãos, por trás e por cima da cabeça, com ambos os pés no chão.',
      'Pontapé de baliza: quando a bola sai pela linha de baliza tocada por último por um atacante, sem ser golo.',
      'Pontapé de canto: quando a bola sai pela linha de baliza tocada por último por um defensor, sem ser golo.',
      'Pontapé de saída: no início de cada parte e depois de cada golo, a partir do centro do campo.',
      'Bola ao solo: depois de uma interrupção sem infração (por exemplo, por lesão).',
    ],
  },
];
