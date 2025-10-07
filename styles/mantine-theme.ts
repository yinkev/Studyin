import { createTheme, MantineColorsTuple } from '@mantine/core';

// Custom color palettes matching existing design tokens
const trust: MantineColorsTuple = [
  '#E6F7FF',
  '#BAE7FF',
  '#91D5FF',
  '#69C0FF',
  '#40A9FF',
  '#1890FF',
  '#096DD9',
  '#0050B3',
  '#003A8C',
  '#002766',
];

const mastery: MantineColorsTuple = [
  '#F9F0FF',
  '#EFDBFF',
  '#D3ADF7',
  '#B37FEB',
  '#9254DE',
  '#722ED1',
  '#531DAB',
  '#391085',
  '#22075E',
  '#120338',
];

const warning: MantineColorsTuple = [
  '#FFFBE6',
  '#FFF1B8',
  '#FFE58F',
  '#FFD666',
  '#FFC53D',
  '#FAAD14',
  '#D48806',
  '#AD6800',
  '#874D00',
  '#613400',
];

const success: MantineColorsTuple = [
  '#F6FFED',
  '#D9F7BE',
  '#B7EB8F',
  '#95DE64',
  '#73D13D',
  '#52C41A',
  '#389E0D',
  '#237804',
  '#135200',
  '#092B00',
];

const danger: MantineColorsTuple = [
  '#FFF1F0',
  '#FFCCC7',
  '#FFA39E',
  '#FF7875',
  '#FF4D4F',
  '#F5222D',
  '#CF1322',
  '#A8071A',
  '#820014',
  '#5C0011',
];

export const theme = createTheme({
  primaryColor: 'trust',
  colors: {
    trust,
    mastery,
    warning,
    success,
    danger,
  },
  fontFamily: 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
  fontFamilyMonospace: 'var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  headings: {
    fontFamily: 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
    fontWeight: '700',
  },
  defaultRadius: 'md',
  respectReducedMotion: true,
  cursorType: 'pointer',
  breakpoints: {
    xs: '36em',   // 576px
    sm: '48em',   // 768px
    md: '62em',   // 992px
    lg: '75em',   // 1200px
    xl: '87.5em', // 1400px
  },
  shadows: {
    xs: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
    sm: '0 1px 3px rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.05) 0px 10px 15px -5px, rgba(0, 0, 0, 0.04) 0px 7px 7px -5px',
    md: '0 1px 3px rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.05) 0px 20px 25px -5px, rgba(0, 0, 0, 0.04) 0px 10px 10px -5px',
    lg: '0 1px 3px rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.05) 0px 28px 23px -7px, rgba(0, 0, 0, 0.04) 0px 12px 12px -7px',
    xl: '0 1px 3px rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.05) 0px 36px 28px -7px, rgba(0, 0, 0, 0.04) 0px 17px 17px -7px',
  },
});
