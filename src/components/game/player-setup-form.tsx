"use client";

import type { PlayerSetupInfo } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';

const playerSchema = z.object({
  name: z.string().min(2, "Nickname must be at least 2 characters").max(15, "Nickname must be at most 15 characters"),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Must be a valid hex color"),
  isReady: z.boolean().optional().default(false),
});

// For single player mode
const singlePlayerFormSchema = playerSchema;

// For multi-player mode (original mode)
const multiPlayerFormSchema = z.object({
  player1: playerSchema,
  player2: playerSchema,
  player3: playerSchema,
  player4: playerSchema,
  player5: playerSchema,
});

type SinglePlayerFormValues = z.infer<typeof singlePlayerFormSchema>;
type MultiPlayerFormValues = z.infer<typeof multiPlayerFormSchema>;

interface PlayerSetupFormProps {
  onSetupComplete: (players: PlayerSetupInfo | PlayerSetupInfo[]) => void;
  singlePlayer?: boolean;
}

const defaultColors = ['#FF0000', '#0000FF', '#00FF00', '#FFFF00', '#800080']; // Red, Blue, Green, Yellow, Purple

export function PlayerSetupForm({ onSetupComplete, singlePlayer = false }: PlayerSetupFormProps) {
  // For single player mode
  const [selectedColor, setSelectedColor] = useState(defaultColors[0]);
  
  // Single player form
  const singlePlayerForm = useForm<SinglePlayerFormValues>({
    resolver: zodResolver(singlePlayerFormSchema),
    defaultValues: {
      name: '',
      color: defaultColors[0],
      isReady: false
    }
  });
  
  // Multi-player form
  const multiPlayerForm = useForm<MultiPlayerFormValues>({
    resolver: zodResolver(multiPlayerFormSchema),
    defaultValues: {
      player1: { name: 'Player 1', color: defaultColors[0], isReady: false },
      player2: { name: 'Player 2', color: defaultColors[1], isReady: false },
      player3: { name: 'Player 3', color: defaultColors[2], isReady: false },
      player4: { name: 'Player 4', color: defaultColors[3], isReady: false },
      player5: { name: 'Player 5', color: defaultColors[4], isReady: false },
    }
  });
  
  // Handle form submission for single player
  const handleSinglePlayerSubmit: SubmitHandler<SinglePlayerFormValues> = (data) => {
    onSetupComplete(data as PlayerSetupInfo);
  };
  
  // Handle form submission for multi-player
  const handleMultiPlayerSubmit: SubmitHandler<MultiPlayerFormValues> = (data) => {
    // Convert from object to array
    const playerInfos: PlayerSetupInfo[] = Object.values(data).map(playerData => ({
      name: playerData.name,
      color: playerData.color,
      isReady: playerData.isReady,
    }));
    onSetupComplete(playerInfos);
  };

  // Render single player form
  if (singlePlayer) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center text-primary">Velocity Dash</CardTitle>
            <CardDescription className="text-center">Arabanızı özelleştirin ve yarışa katılın!</CardDescription>
          </CardHeader>
          <form onSubmit={singlePlayerForm.handleSubmit(handleSinglePlayerSubmit)}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nickname</Label>
                <Controller
                  name="name"
                  control={singlePlayerForm.control}
                  render={({ field }) => <Input id="name" {...field} placeholder="Enter your nickname" />}
                />
                {singlePlayerForm.formState.errors.name && (
                  <p className="text-sm text-destructive">{singlePlayerForm.formState.errors.name.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="color">Car Color</Label>
                <Controller
                  name="color"
                  control={singlePlayerForm.control}
                  render={({ field }) => (
                    <Input
                      id="color"
                      type="color"
                      className="w-full h-12 p-1"
                      value={field.value}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        setSelectedColor(e.target.value);
                      }}
                    />
                  )}
                />
                {singlePlayerForm.formState.errors.color && (
                  <p className="text-sm text-destructive">{singlePlayerForm.formState.errors.color.message}</p>
                )}
              </div>
              
              <div className="pt-4">
                <div className="w-full bg-card p-4 rounded-md border">
                  <h3 className="text-lg font-semibold mb-2 text-center">Araba Önizleme</h3>
                  <div className="flex justify-center p-4">
                    <div className="relative">
                      <svg width="120" height="80" viewBox="0 0 120 80">
                        <rect x="20" y="20" width="80" height="40" rx="10" fill={selectedColor} />
                        <rect x="10" y="30" width="10" height="20" fill={selectedColor} />
                        <rect x="100" y="30" width="10" height="20" fill={selectedColor} />
                        <circle cx="30" cy="60" r="10" fill="black" />
                        <circle cx="90" cy="60" r="10" fill="black" />
                        <rect x="30" y="10" width="60" height="10" rx="5" fill={selectedColor} />
                        <rect x="40" y="25" width="15" height="10" rx="2" fill="lightblue" />
                        <rect x="65" y="25" width="15" height="10" rx="2" fill="lightblue" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full">Katıl</Button>
              <p className="text-xs text-muted-foreground text-center">
                Yarışın başlaması için en az 3 oyuncu "Hazırım" demiş olmalı.
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  // Render original multi-player form (kept for backward compatibility)
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl shadow-2xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-primary">Velocity Dash Setup</CardTitle>
          <CardDescription className="text-center">Customize your racers (up to 5). At least 3 players must be ready to start!</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={multiPlayerForm.handleSubmit(handleMultiPlayerSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {([1, 2, 3, 4, 5] as const).map((playerNum) => (
                <div key={playerNum} className="space-y-4 p-4 border rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold text-center text-accent-foreground">Player {playerNum}</h3>
                  <div className="space-y-2">
                    <Label htmlFor={`player${playerNum}_name`}>Nickname</Label>
                    <Controller
                      name={`player${playerNum}.name` as any}
                      control={multiPlayerForm.control}
                      render={({ field }) => <Input id={`player${playerNum}_name`} {...field} placeholder={`Enter P${playerNum} Nickname`} />}
                    />
                    {multiPlayerForm.formState.errors[`player${playerNum}`]?.name && (
                      <p className="text-sm text-destructive">{multiPlayerForm.formState.errors[`player${playerNum}`]?.name?.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`player${playerNum}_color`}>Car Color</Label>
                    <Controller
                      name={`player${playerNum}.color` as any}
                      control={multiPlayerForm.control}
                      render={({ field }) => (
                        <Input
                          id={`player${playerNum}_color`}
                          type="color"
                          className="w-full h-12 p-1"
                          value={field.value}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                          }}
                        />
                      )}
                    />
                     {multiPlayerForm.formState.errors[`player${playerNum}`]?.color && (
                      <p className="text-sm text-destructive">{multiPlayerForm.formState.errors[`player${playerNum}`]?.color?.message}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 mt-3">
                    <Controller
                      name={`player${playerNum}.isReady` as any}
                      control={multiPlayerForm.control}
                      render={({ field }) => (
                        <Checkbox
                          id={`player${playerNum}_isReady`}
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <Label htmlFor={`player${playerNum}_isReady`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Hazırım
                    </Label>
                  </div>
                </div>
              ))}
            </div>
            <CardFooter className="flex justify-center pt-8">
              <Button type="submit" size="lg" className="w-1/2">
                Start Race
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}