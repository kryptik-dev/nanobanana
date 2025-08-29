# Nano Banana

The next-generation AI image editor that blends speed, consistency, and creative freedom into one powerful package.

## Features

- **AI Image Generation** - Create images from text descriptions using DALL-E 3
- **Natural Language** - Generate images using simple text prompts
- **High Quality** - Professional-grade 1024x1024 images
- **Fast Processing** - Quick generation with OpenRouter's reliable API
- **Free Tier** - Includes free credits for testing and development

**Note**: This version generates new images based on text prompts. For true image-to-image editing, you would need a different service like Replicate or RunwayML.

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up OpenRouter API key:
   - Go to [https://openrouter.ai/](https://openrouter.ai/) and sign up
   - Get your free API key (includes free credits)
   - Create a `.env` file in the root directory with:
     ```
     VITE_OPENROUTER_API_KEY=your_api_key_here
     ```
4. Start the development server: `npm run dev`
5. Open [http://localhost:5173](http://localhost:5173) in your browser

## Tech Stack

- React 18
- TypeScript
- Tailwind CSS
- Shadcn/ui Components
- Vite

## Project Structure

- `/src/pages/Landing.tsx` - Main landing page
- `/src/pages/Index.tsx` - Chat interface
- `/src/components/` - Reusable UI components
- `/src/hooks/` - Custom React hooks
- `/src/lib/` - Utility functions and constants

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## License

© 2024 Nano Banana. All rights reserved.
