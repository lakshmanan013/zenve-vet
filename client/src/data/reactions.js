import likePuppy from '../assets/reactions/like_puppy.png';
import likeKitty from '../assets/reactions/like_kitty.png';
import likeBunny from '../assets/reactions/like_bunny.png';
import likePeach from '../assets/reactions/like_peach.png';
import likeChick from '../assets/reactions/like_chick.png';
import likeMochi from '../assets/reactions/like_mochi.png';

import sadPuppy from '../assets/reactions/sad_puppy.png';
import sadKitty from '../assets/reactions/sad_kitty.png';
import sadBunny from '../assets/reactions/sad_bunny.png';
import sadPeach from '../assets/reactions/sad_peach.png';
import sadChick from '../assets/reactions/sad_chick.png';
import sadMochi from '../assets/reactions/sad_mochi.png';

export const LIKE_REACTIONS = [
  { id: 'like_puppy', key: 'puppy', type: 'like', label: 'Puppy Like', icon: likePuppy, color: '#d97706' },
  { id: 'like_kitty', key: 'kitty', type: 'like', label: 'Kitty Cheer', icon: likeKitty, color: '#8b5cf6' },
  { id: 'like_bunny', key: 'bunny', type: 'like', label: 'Bunny Love', icon: likeBunny, color: '#ec4899' },
  { id: 'like_peach', key: 'peach', type: 'like', label: 'Peach Heart', icon: likePeach, color: '#f43f5e' },
  { id: 'like_chick', key: 'chick', type: 'like', label: 'Chick Wink', icon: likeChick, color: '#eab308' },
  { id: 'like_mochi', key: 'mochi', type: 'like', label: 'Mochi Thumbs Up', icon: likeMochi, color: '#10b981' },
];

export const DISLIKE_REACTIONS = [
  { id: 'sad_puppy', key: 'puppy', type: 'dislike', label: 'Puppy Sad', icon: sadPuppy, color: '#ef4444' },
  { id: 'sad_kitty', key: 'kitty', type: 'dislike', label: 'Kitty Dislike', icon: sadKitty, color: '#ef4444' },
  { id: 'sad_bunny', key: 'bunny', type: 'dislike', label: 'Bunny Pout', icon: sadBunny, color: '#ef4444' },
  { id: 'sad_peach', key: 'peach', type: 'dislike', label: 'Peach Dislike', icon: sadPeach, color: '#ef4444' },
  { id: 'sad_chick', key: 'chick', type: 'dislike', label: 'Chick Angry', icon: sadChick, color: '#ef4444' },
  { id: 'sad_mochi', key: 'mochi', type: 'dislike', label: 'Mochi Grumpy', icon: sadMochi, color: '#ef4444' },
];

export const ALL_REACTIONS = [...LIKE_REACTIONS, ...DISLIKE_REACTIONS];

export const REACTION_MAP = Object.fromEntries(ALL_REACTIONS.map(r => [r.id, r]));

export const REACTION_ICONS = {
  puppy: likePuppy,
  kitty: likeKitty,
  bunny: likeBunny,
  peach: likePeach,
  chick: likeChick,
  mochi: likeMochi
};

export const SAD_REACTION_ICONS = {
  puppy: sadPuppy,
  kitty: sadKitty,
  bunny: sadBunny,
  peach: sadPeach,
  chick: sadChick,
  mochi: sadMochi
};

export const DEFAULT_LIKE_ICON = likePuppy;
export const DEFAULT_DISLIKE_ICON = sadPuppy;
export default likePuppy;
