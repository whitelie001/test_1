import { validateMediaSelection } from './media-selection-validator';

describe('validateMediaSelection', () => {
  it('미디어 없이 텍스트만이면 유효', () => {
    expect(validateMediaSelection([])).toEqual({ valid: true });
  });

  it('사진 10장까지는 유효', () => {
    expect(validateMediaSelection(Array(10).fill('image/jpeg')).valid).toBe(true);
  });

  it('사진 11장은 거부', () => {
    expect(validateMediaSelection(Array(11).fill('image/jpeg')).valid).toBe(false);
  });

  it('영상 1개는 유효', () => {
    expect(validateMediaSelection(['video/mp4']).valid).toBe(true);
  });

  it('영상 2개는 거부', () => {
    expect(validateMediaSelection(['video/mp4', 'video/mp4']).valid).toBe(false);
  });

  it('사진과 영상을 섞으면 거부', () => {
    expect(validateMediaSelection(['image/jpeg', 'video/mp4']).valid).toBe(false);
  });

  it('지원하지 않는 형식은 거부', () => {
    expect(validateMediaSelection(['application/pdf']).valid).toBe(false);
  });
});
