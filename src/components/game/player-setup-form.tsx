"use client";

import type { PlayerSetupInfo } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm, Controller, SubmitHandler, FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';

const playerSchema = z.object({
  name: z.string().min(2, "Nickname must be at least 2 characters").max(15, "Nickname must be at most 15 characters"),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Must be a valid hex color"),
});

const formSchema = z.object({
  player1: playerSchema,
  player2: playerSchema,
  player3: playerSchema,
  player4: playerSchema,
  player5: playerSchema,
});

type PlayerSetupFormValues = z.infer<typeof formSchema>;

interface PlayerSetupFormProps {
  onSetupComplete: (players: PlayerSetupInfo[]) => void;
}

const defaultColors = ['#FF0000', '#0000FF', '#00FF00', '#FFFF00', '#800080']; // Red, Blue, Green, Yellow, Purple

export function PlayerSetupForm({ onSetupComplete }: PlayerSetupFormProps) {
  const [playerColors, setPlayerColors] = useState<string[]>(defaultColors);

  const { control, handleSubmit, formState: { errors }, setValue } = useForm<PlayerSetupFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      player1: { name: 'Player 1', color: defaultColors[0] },
      player2: { name: 'Player 2', color: defaultColors[1] },
      player3: { name: 'Player 3', color: defaultColors[2] },
      player4: { name: 'Player 4', color: defaultColors[3] },
      player5: { name: 'Player 5', color: defaultColors[4] },
    },
  });

  const onSubmit: SubmitHandler<PlayerSetupFormValues> = (data) => {
    onSetupComplete([data.player1, data.player2, data.player3, data.player4, data.player5]);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl shadow-2xl"> {/* Increased max-width for 5 players */}
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-primary">Velocity Dash Setup</CardTitle>
          <CardDescription className="text-center">Customize your racers (up to 5) and get ready to dash!</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Grid layout adjusted for potentially 5 players */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {([1, 2, 3, 4, 5] as const).map((playerNum) => (
                <div key={playerNum} className="space-y-4 p-4 border rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold text-center text-accent-foreground">Player {playerNum}</h3>
                  <div className="space-y-2">
                    <Label htmlFor={`player${playerNum}_name`}>Nickname</Label>
                    <Controller
                      name={`player${playerNum}.name` as FieldPath<PlayerSetupFormValues>}
                      control={control}
                      render={({ field }) => <Input id={`player${playerNum}_name`} {...field} placeholder={`Enter P${playerNum} Nickname`} />}
                    />
                    {errors && errors[`player${playerNum}`]?.name && (
                      <p className="text-sm text-destructive">{errors[`player${playerNum}`]?.name?.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`player${playerNum}_color`}>Car Color</Label>
                    <Controller
                      name={`player${playerNum}.color` as FieldPath<PlayerSetupFormValues>}
                      control={control}
                      render={({ field }) => (
                        <Input
                          id={`player${playerNum}_color`}
                          type="color"
                          className="w-full h-12 p-1"
                          value={playerColors[playerNum - 1]}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            const newColors = [...playerColors];
                            newColors[playerNum - 1] = e.target.value;
                            setPlayerColors(newColors);
                            setValue(`player${playerNum}.color` as FieldPath<PlayerSetupFormValues>, e.target.value, { shouldValidate: true });
                          }}
                        />
                      )}
                    />
                     {errors && errors[`player${playerNum}`]?.color && (
                      <p className="text-sm text-destructive">{errors[`player${playerNum}`]?.color?.message}</p>
                    )}
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
