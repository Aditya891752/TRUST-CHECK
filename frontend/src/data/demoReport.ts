import type { CheckResponse } from '../lib/types';

export const APOLLO_TEXT =
  "The Apollo 11 mission, launched on July 20, 1969, was the first crewed mission to land on the Moon. Neil Armstrong was the first person to set foot on the lunar surface, reportedly saying “That’s one small step for a man, one giant leap for mankind.” The mission lasted eight days and successfully returned to Earth. Since then, six more Apollo missions landed on the Moon, and humans have returned several times, with the last lunar mission in 1972. The Moon landing proved that humans could live on the Moon, and a permanent base has been established there since 2010. NASA continues to operate the base, and by 2030, human missions to Mars are expected to begin as part of the Artemis program.";

export const MOCK_REPORT_APOLLO: CheckResponse = {
  request_id: 'TC-20250426-7813',
  language: 'en',
  answer_normalized: APOLLO_TEXT,
  summary: {
    supported: 5,
    uncertain: 2,
    unsupported: 1,
  },
  notices: [
    {
      code: 'instruction_in_input',
      message: 'Instruction Detected: Input',
      excerpt: 'Ignore all previous instructions...',
    },
  ],
  claims: [
    {
      id: 'c1',
      text: 'Apollo 11 was launched on July 20, 1969.',
      verdict: 'supported',
      reasoning: 'This date is widely documented in reliable sources, including NASA and Encyclopaedia Britannica.',
      span: { start: 35, end: 48 },
      flags: [
        { type: 'number', text: '1969', start: 44, end: 48 },
        { type: 'date', text: 'July 20', start: 35, end: 42 },
      ],
      evidence: [
        {
          id: 'e1',
          url: 'https://www.nasa.gov/mission_pages/apollo/apollo-11.html',
          title: 'Apollo 11 Mission Overview • Jul 20, 2019, 10:24 UTC',
          stance: 'supports',
          snippet: 'Apollo 11 launched from Cape Kennedy on July 20, 1969, carrying Commander Neil Armstrong...',
          quote: 'Apollo 11 launched from Cape Kennedy on July 20, 1969...',
          retrieved_at: '2025-04-26T14:32:00Z',
        },
      ],
    },
    {
      id: 'c2',
      text: 'Apollo 11 was the first crewed mission to land on the Moon.',
      verdict: 'supported',
      reasoning: 'Verified by international historical consensus and NASA records.',
      span: { start: 58, end: 99 },
      flags: [{ type: 'historical', text: 'first crewed mission', start: 58, end: 77 }],
      evidence: [
        {
          id: 'e2',
          url: 'https://www.nasa.gov/history/apollo-11',
          title: 'NASA Historical Data • First Lunar Landing',
          stance: 'supports',
          snippet: 'First crewed lunar landing in history.',
          retrieved_at: '2025-04-26T14:32:00Z',
        },
      ],
    },
    {
      id: 'c3',
      text: 'Neil Armstrong was the first person to set foot on the lunar surface.',
      verdict: 'supported',
      reasoning: 'Neil Armstrong stepped off the Eagle lunar module onto the lunar surface on July 20, 1969.',
      span: { start: 101, end: 170 },
      flags: [{ type: 'name', text: 'Neil Armstrong', start: 101, end: 115 }],
      evidence: [
        {
          id: 'e3',
          url: 'https://www.nasa.gov/astronauts/armstrong',
          title: 'Neil Armstrong Astronaut Biography',
          stance: 'supports',
          snippet: 'Neil Armstrong was the first person to walk on the Moon.',
          retrieved_at: '2025-04-26T14:32:00Z',
        },
      ],
    },
    {
      id: 'c4',
      text: 'Six more Apollo missions landed on the Moon.',
      verdict: 'supported',
      reasoning: 'Apollo 12, 14, 15, 16, and 17 landed successfully (Apollo 13 had an in-flight abort).',
      span: { start: 307, end: 336 },
      flags: [{ type: 'number', text: '6 missions', start: 307, end: 315 }],
      evidence: [
        {
          id: 'e4',
          url: 'https://www.nasa.gov/apollo',
          title: 'Apollo Missions Index',
          stance: 'supports',
          snippet: 'Six Apollo missions successfully landed on the lunar surface.',
          retrieved_at: '2025-04-26T14:32:00Z',
        },
      ],
    },
    {
      id: 'c5',
      text: 'Humans have returned several times, with the last lunar mission in 1972.',
      verdict: 'uncertain',
      reasoning: 'Apollo 17 in 1972 was the last lunar mission. The statement "humans have returned several times" is vague and could be misinterpreted.',
      span: { start: 391, end: 417 },
      flags: [{ type: 'date', text: '1972', start: 413, end: 417 }],
      evidence: [
        {
          id: 'e5',
          url: 'https://www.britannica.com/topic/Apollo-program',
          title: 'Apollo Program • Jan 14, 2020, 15:03 UTC',
          stance: 'neutral',
          snippet: 'Apollo 17 was the final mission of NASA’s Apollo program, landing in December 1972.',
          quote: 'Apollo 17 was the final mission of NASA’s Apollo program, landing in December 1972.',
          retrieved_at: '2025-04-26T14:32:00Z',
        },
      ],
    },
    {
      id: 'c6',
      text: 'A permanent base has been established on the Moon since 2010.',
      verdict: 'unsupported',
      reasoning: 'There is no credible evidence of a permanent human base on the Moon. As of 2024, no such base exists.',
      span: { start: 469, end: 530 },
      flags: [{ type: 'date', text: '2010', start: 526, end: 530 }],
      evidence: [
        {
          id: 'e6',
          url: 'https://www.nasa.gov/moon-exploration',
          title: 'Moon Exploration: Facts and Future • Mar 10, 2024, 18:20 UTC',
          stance: 'contradicts',
          snippet: 'NASA plans future lunar base under Artemis.',
          quote: 'NASA plans human return to the Moon via Artemis, but no permanent base currently exists.',
          retrieved_at: '2025-04-26T14:32:00Z',
        },
      ],
    },
    {
      id: 'c7',
      text: 'By 2030, human missions to Mars are expected to begin.',
      verdict: 'unsupported',
      reasoning: 'Current Artemis architecture targets lunar presence; human Mars timelines remain exploratory targets rather than scheduled programs.',
      span: { start: 569, end: 631 },
      flags: [{ type: 'date', text: '2030', start: 572, end: 576 }],
      evidence: [
        {
          id: 'e7',
          url: 'https://www.nasa.gov/artemis',
          title: 'Artemis Program Timeline Overview',
          stance: 'contradicts',
          snippet: 'Long term goals explore potential Mars transit in late 2030s.',
          retrieved_at: '2025-04-26T14:32:00Z',
        },
      ],
    },
  ],
  corrected_answer: {
    text:
      'The Apollo 11 mission, launched on July 20, 1969, was the first crewed mission to land on the Moon. Neil Armstrong was the first person to set foot on the lunar surface, reportedly saying “That’s one small step for a man, one giant leap for mankind.” The mission lasted eight days and successfully returned to Earth. Since then, six more Apollo missions landed on the Moon, with the last human lunar mission in 1972. [Softened] While the Moon landing demonstrated that humans could visit and conduct short-term missions on the Moon, there is currently no permanent base on the Moon. [Removed] Claims about a base since 2010 are not supported by reliable sources. NASA continues to plan for future exploration, and human missions to Mars may begin in the 2030s as part of the Artemis program.',
    changes: [
      { claim_id: '1', action: 'kept' },
      { claim_id: '2', action: 'kept' },
      { claim_id: '3', action: 'kept' },
      { claim_id: '4', action: 'kept' },
      { claim_id: '5', action: 'hedged' },
      { claim_id: '6', action: 'removed' },
      { claim_id: '7', action: 'removed' },
    ],
  },
};
