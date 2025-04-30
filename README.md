# Compare Audio

A Next.js application for comparing different versions of audio files with an interactive waveform visualization using wavesurfer.js.

## Features

- Switch between different audio versions (A, B, X) with a single click
- Visual waveform representation of each audio file
- Synchronized playback when switching between versions
- Simple and intuitive UI with Tailwind CSS

## Getting Started

First, install the dependencies:

```bash
npm install
# or
yarn
# or
pnpm install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Adding Audio Files

Place your audio files in the `public` directory with the following names:
- `A.mp3` - First audio version
- `B.mp3` - Second audio version
- `X.mp3` - Third audio version

Make sure all files are of the same length for the best experience.

## Deployment with Vercel

This project is ready to be deployed on Vercel. You can deploy it in a few easy steps:

1. Install Vercel CLI (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy the project:
   ```bash
   vercel
   ```

Or simply click the "Deploy with Vercel" button on the homepage to deploy through the Vercel dashboard.

## Technologies Used

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [wavesurfer.js](https://wavesurfer.xyz/)
- [Vercel](https://vercel.com/)