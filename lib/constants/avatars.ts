export interface AvatarOption {
  id: string;
  src: string;
  label: string;
}

export const AVATARS: AvatarOption[] = [
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
  { id: 'unicorn', src: '/avatars/unicorn.svg', label: '유니콘' },
];
