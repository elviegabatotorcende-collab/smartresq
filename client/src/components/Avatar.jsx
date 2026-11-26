import { FILE_URL } from '../api';

// Round profile picture: the uploaded photo, or the person's initials.
export default function Avatar({ user, size = 40 }) {
  const initials = (user?.fullname || '?')
    .split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

  const base = { width: size, height: size, borderRadius: '50%', flexShrink: 0 };

  if (user?.imagename) {
    return <img src={FILE_URL + user.imagename} alt="" style={{ ...base, objectFit: 'cover', background: '#e4e7ec' }} />;
  }
  return (
    <span
      aria-hidden="true"
      style={{
        ...base, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: size * 0.38,
        color: '#f5b301', background: 'linear-gradient(135deg, #1f3a93, #0f2557)',
      }}
    >
      {initials}
    </span>
  );
}