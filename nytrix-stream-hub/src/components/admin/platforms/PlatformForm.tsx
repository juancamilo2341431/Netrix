
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { DialogClose, DialogFooter } from "@/components/ui/dialog";

import { PlatformImageUpload } from "./PlatformImageUpload";
import { platformSchema, type PlatformFormValues } from "./platform-schema";

interface PlatformFormProps {
  onSubmit: (data: PlatformFormValues, imageFile: File | null) => Promise<void>;
  isSubmitting: boolean;
  defaultValues?: PlatformFormValues;
  currentImageUrl?: string | null;
}

export const PlatformForm = ({ 
  onSubmit, 
  isSubmitting, 
  defaultValues = {
    nombre: "",
    descripcion: "",
    precio: "",
  },
  currentImageUrl = null
}: PlatformFormProps) => {
  const [imageFile, setImageFile] = useState<File | null>(null);

  const form = useForm<PlatformFormValues>({
    resolver: zodResolver(platformSchema),
    defaultValues,
  });

  const handleSubmit = async (data: PlatformFormValues) => {
    await onSubmit(data, imageFile);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de la plataforma</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Netflix" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="descripcion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Descripción detallada de la plataforma..." 
                  className="resize-none" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="precio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Precio</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2">$</span>
                  <Input 
                    type="text"
                    placeholder="99.99" 
                    className="pl-7" 
                    {...field} 
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <PlatformImageUpload 
          imageFile={imageFile} 
          setImageFile={setImageFile}
          currentImageUrl={currentImageUrl}
        />

        <DialogFooter className="sm:justify-between">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </DialogClose>
          <Button 
            type="submit"
            className="bg-gradient-nytrix hover:opacity-90"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Guardando..." : "Guardar Plataforma"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};
