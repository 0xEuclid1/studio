"use client";

import type { PlayerSetupInfo } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
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
});

type PlayerSetupFormValues = z.infer<typeof formSchema>;

interface PlayerSetupFormProps {
  onSetupComplete: (players: [PlayerSetupInfo, PlayerSetupInfo]) => void;
}

const defaultColors = ['#FF0000', '#0000FF'];

export function PlayerSetupForm({ onSetupComplete }: PlayerSetupFormProps) {
  const [p1Color, setP1Color] = useState(defaultColors[0]);
  const [p2Color, setP2Color] = useState(defaultColors[1]);

  const { control, handleSubmit, formState: { errors }, setValue } = useForm<PlayerSetupFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      player1: { name: 'Player 1', color: defaultColors[0] },
      player2: { name: 'Player 2', color: defaultColors[1] },
    },
  });

  const onSubmit: SubmitHandler<PlayerSetupFormValues> = (data) => {
    onSetupComplete([data.player1, data.player2]);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-primary">Velocity Dash Setup</CardTitle>
          <CardDescription className="text-center">Customize your racers and get ready to dash!</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {([1, 2] as const).map((playerNum) => (
                <div key={playerNum} className="space-y-4 p-4 border rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold text-center text-accent-foreground">Player {playerNum}</h3>
                  <div className="space-y-2">
                    <Label htmlFor={`player${playerNum}_name`}>Nickname</Label>
                    <Controller
                      name={`player${playerNum}.name` as const}
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
                      name={`player${playerNum}.color` as const}
                      control={control}
                      render={({ field }) => (
                        <Input
                          id={`player${playerNum}_color`}
                          type="color"
                          className="w-full h-12 p-1"
                          value={playerNum === 1 ? p1Color : p2Color}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            if (playerNum === 1) setP1Color(e.target.value);
                            else setP2Color(e.target.value);
                            setValue(`player${playerNum}.color`, e.target.value, { shouldValidate: true });
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
