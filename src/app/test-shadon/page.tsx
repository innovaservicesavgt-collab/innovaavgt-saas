import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function TestShadcn() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Prueba de shadcn/ui</h1>
          <p className="text-muted-foreground">
            Si ves todo con estilos bonitos, la instalación fue exitosa.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Formulario de ejemplo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre del cliente</Label>
              <Input id="nombre" placeholder="Juan Pérez" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dpi">DPI</Label>
              <Input id="dpi" placeholder="1234 56789 0101" />
            </div>
            <div className="flex gap-2">
              <Button>Guardar</Button>
              <Button variant="outline">Cancelar</Button>
              <Button variant="destructive">Eliminar</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Badges (estados)</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Badge>Activo</Badge>
            <Badge variant="secondary">Pendiente</Badge>
            <Badge variant="outline">Archivado</Badge>
            <Badge variant="destructive">Urgente</Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}