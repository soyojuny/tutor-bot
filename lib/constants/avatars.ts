export interface AvatarOption {
  id: string;
  src: string;
  label: string;
}

export interface AvatarCategory {
  id: string;
  label: string;
  avatars: AvatarOption[];
}

export const AVATAR_CATEGORIES: AvatarCategory[] = [
  {
    id: 'people',
    label: '사람',
    avatars: [
      { id: 'boy-hero', src: '/avatars/boy-hero.svg', label: '히어로 소년' },
      { id: 'girl-hero', src: '/avatars/girl-hero.svg', label: '히어로 소녀' },
      { id: 'boy-wizard', src: '/avatars/boy-wizard.svg', label: '마법사 소년' },
      { id: 'girl-wizard', src: '/avatars/girl-wizard.svg', label: '마법사 소녀' },
      { id: 'boy-astronaut', src: '/avatars/boy-astronaut.svg', label: '우주비행사' },
      { id: 'girl-princess', src: '/avatars/girl-princess.svg', label: '공주' },
      { id: 'boy-pirate', src: '/avatars/boy-pirate.svg', label: '해적' },
      { id: 'girl-ninja', src: '/avatars/girl-ninja.svg', label: '닌자' },
    ],
  },
  {
    id: 'animals',
    label: '동물',
    avatars: [
      { id: 'bear', src: '/avatars/bear.svg', label: '곰' },
      { id: 'cat', src: '/avatars/cat.svg', label: '고양이' },
      { id: 'dog', src: '/avatars/dog.svg', label: '강아지' },
      { id: 'fox', src: '/avatars/fox.svg', label: '여우' },
      { id: 'koala', src: '/avatars/koala.svg', label: '코알라' },
      { id: 'lion', src: '/avatars/lion.svg', label: '사자' },
      { id: 'owl', src: '/avatars/owl.svg', label: '부엉이' },
      { id: 'panda', src: '/avatars/panda.svg', label: '판다' },
      { id: 'penguin', src: '/avatars/penguin.svg', label: '펭귄' },
      { id: 'rabbit', src: '/avatars/rabbit.svg', label: '토끼' },
      { id: 'tiger', src: '/avatars/tiger.svg', label: '호랑이' },
      { id: 'dolphin', src: '/avatars/dolphin.svg', label: '돌고래' },
      { id: 'butterfly', src: '/avatars/butterfly.svg', label: '나비' },
    ],
  },
  {
    id: 'fantasy',
    label: '판타지',
    avatars: [
      { id: 'unicorn', src: '/avatars/unicorn.svg', label: '유니콘' },
      { id: 'dragon', src: '/avatars/dragon.svg', label: '드래곤' },
      { id: 'phoenix', src: '/avatars/phoenix.svg', label: '불사조' },
      { id: 'fairy', src: '/avatars/fairy.svg', label: '요정' },
      { id: 'dino', src: '/avatars/dino.svg', label: '공룡' },
      { id: 'robot', src: '/avatars/robot.svg', label: '로봇' },
      { id: 'alien', src: '/avatars/alien.svg', label: '외계인' },
    ],
  },
];

// Flat list for backward compatibility
export const AVATARS: AvatarOption[] = AVATAR_CATEGORIES.flatMap((c) => c.avatars);
