import * as React from 'react';
import { mount } from 'enzyme';
import LanguageCardFooter from '../src/comp/LanguageCardFooter';

describe('LanguageCardFooter', () => {
  it('displays word details and part of speech', () => {
    const wrap = mount(<LanguageCardFooter wordDetails="detail" partOfSpeech="noun" />);
    const text = wrap.text();
    expect(text).toContain('detail');
    expect(text).toContain('noun');
  });

  it('falls back to part of speech only when no details provided', () => {
    const wrap = mount(<LanguageCardFooter partOfSpeech="verb" />);
    const text = wrap.text();
    expect(text).toContain('verb');
  });
});
