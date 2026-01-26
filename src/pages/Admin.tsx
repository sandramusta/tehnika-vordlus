import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  useEquipment,
  useBrands,
  usePowerClasses,
  useEquipmentTypes,
  useCompetitiveArguments,
  useCreateEquipment,
  useUpdateEquipment,
  useDeleteEquipment,
  useCreateArgument,
  useUpdateArgument,
  useDeleteArgument,
  useMyths,
  useCreateMyth,
  useUpdateMyth,
  useDeleteMyth,
} from "@/hooks/useEquipmentData";
import { Plus, Trash2, Tractor, MessageSquare, Pencil, MessageSquareWarning, Wallet, Wrench, CloudSun, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import type { Equipment, CompetitiveArgument, Myth } from "@/types/equipment";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { cn } from "@/lib/utils";

function getBrandTextColor(brandName: string): string {
  switch (brandName) {
    case "John Deere":
      return "text-john-deere";
    case "Claas":
      return "text-claas";
    case "Case IH":
      return "text-case-ih";
    case "New Holland":
      return "text-new-holland";
    case "Fendt":
      return "text-fendt";
    default:
      return "text-foreground";
  }
}

const MYTH_CATEGORIES = [
  { value: "finance", label: "Finantsid ja investeeringud", icon: Wallet },
  { value: "tech", label: "Tehnika ja töökindlus", icon: Wrench },
  { value: "weather", label: "Ilm, saagikus ja juhtimine", icon: CloudSun },
  { value: "market", label: "Turg ja konkurents", icon: TrendingUp },
];

export default function Admin() {
  const { toast } = useToast();
  const [equipmentDialogOpen, setEquipmentDialogOpen] = useState(false);
  const [argumentDialogOpen, setArgumentDialogOpen] = useState(false);
  const [mythDialogOpen, setMythDialogOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [editingArgument, setEditingArgument] = useState<CompetitiveArgument | null>(null);
  const [editingMyth, setEditingMyth] = useState<Myth | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [threshingImageUrl, setThreshingImageUrl] = useState<string>("");

  const { data: equipment = [] } = useEquipment();
  const { data: brands = [] } = useBrands();
  const { data: powerClasses = [] } = usePowerClasses();
  const { data: types = [] } = useEquipmentTypes();
  const { data: args = [] } = useCompetitiveArguments();
  const { data: myths = [] } = useMyths();

  const createEquipment = useCreateEquipment();
  const updateEquipment = useUpdateEquipment();
  const deleteEquipment = useDeleteEquipment();
  const createArgument = useCreateArgument();
  const updateArgument = useUpdateArgument();
  const deleteArgument = useDeleteArgument();
  const createMyth = useCreateMyth();
  const updateMyth = useUpdateMyth();
  const deleteMyth = useDeleteMyth();

  const combineType = types.find((t) => t.name === "combine");

  const handleEquipmentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const equipmentData = {
      equipment_type_id: formData.get("equipment_type_id") as string,
      brand_id: formData.get("brand_id") as string,
      power_class_id: (formData.get("power_class_id") as string) || null,
      model_name: formData.get("model_name") as string,
      engine_power_hp: Number(formData.get("engine_power_hp")) || null,
      grain_tank_liters: Number(formData.get("grain_tank_liters")) || null,
      header_width_m: Number(formData.get("header_width_m")) || null,
      weight_kg: Number(formData.get("weight_kg")) || null,
      fuel_consumption_lh: Number(formData.get("fuel_consumption_lh")) || null,
      price_eur: Number(formData.get("price_eur")) || null,
      annual_maintenance_eur: Number(formData.get("annual_maintenance_eur")) || null,
      expected_lifespan_years: Number(formData.get("expected_lifespan_years")) || 10,
      notes: (formData.get("notes") as string) || null,
      data_source_url: (formData.get("data_source_url") as string) || null,
      image_url: imageUrl || null,
      threshing_system_image_url: threshingImageUrl || null,
      // Technical specs from brochures
      fuel_tank_liters: Number(formData.get("fuel_tank_liters")) || null,
      cleaning_area_m2: Number(formData.get("cleaning_area_m2")) || null,
      rotor_diameter_mm: Number(formData.get("rotor_diameter_mm")) || null,
      throughput_tons_h: Number(formData.get("throughput_tons_h")) || null,
      engine_displacement_liters: Number(formData.get("engine_displacement_liters")) || null,
    };

    try {
      if (editingEquipment) {
        await updateEquipment.mutateAsync({ id: editingEquipment.id, ...equipmentData });
        toast({ title: "Tehnika uuendatud!" });
      } else {
        await createEquipment.mutateAsync({ ...equipmentData, features: [] });
        toast({ title: "Tehnika lisatud!" });
      }
      setEquipmentDialogOpen(false);
      setEditingEquipment(null);
      setImageUrl("");
      setThreshingImageUrl("");
    } catch (error) {
      toast({
        title: "Viga",
        description: editingEquipment ? "Tehnika uuendamine ebaõnnestus" : "Tehnika lisamine ebaõnnestus",
        variant: "destructive",
      });
    }
  };

  const handleArgumentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const problemText = formData.get("problem_text") as string;
    const solutionText = formData.get("solution_text") as string;
    const benefitText = formData.get("benefit_text") as string;

    const argumentData = {
      competitor_brand_id: formData.get("competitor_brand_id") as string,
      equipment_type_id: combineType?.id || "",
      argument_title: formData.get("argument_title") as string,
      // Keep argument_description for backwards compatibility
      argument_description: solutionText || "",
      category: formData.get("category") as string,
      sort_order: editingArgument?.sort_order ?? 0,
      // New Problem-Solution-Benefit fields
      problem_text: problemText || null,
      solution_text: solutionText || null,
      benefit_text: benefitText || null,
      icon_name: formData.get("icon_name") as string || "Lightbulb",
    };

    try {
      if (editingArgument) {
        await updateArgument.mutateAsync({ id: editingArgument.id, ...argumentData });
        toast({ title: "Argument uuendatud!" });
      } else {
        await createArgument.mutateAsync(argumentData);
        toast({ title: "Argument lisatud!" });
      }
      setArgumentDialogOpen(false);
      setEditingArgument(null);
    } catch (error) {
      toast({
        title: "Viga",
        description: editingArgument ? "Argumendi uuendamine ebaõnnestus" : "Argumendi lisamine ebaõnnestus",
        variant: "destructive",
      });
    }
  };

  const openEditEquipment = (item: Equipment) => {
    setEditingEquipment(item);
    setImageUrl(item.image_url || "");
    setThreshingImageUrl(item.threshing_system_image_url || "");
    setEquipmentDialogOpen(true);
  };

  const openEditArgument = (arg: CompetitiveArgument) => {
    setEditingArgument(arg);
    setArgumentDialogOpen(true);
  };

  const openEditMyth = (myth: Myth) => {
    setEditingMyth(myth);
    setMythDialogOpen(true);
  };

  const closeEquipmentDialog = () => {
    setEquipmentDialogOpen(false);
    setEditingEquipment(null);
    setImageUrl("");
    setThreshingImageUrl("");
  };

  const closeArgumentDialog = () => {
    setArgumentDialogOpen(false);
    setEditingArgument(null);
  };

  const closeMythDialog = () => {
    setMythDialogOpen(false);
    setEditingMyth(null);
  };

  const handleMythSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const mythData = {
      category: formData.get("category") as string,
      myth: formData.get("myth") as string,
      reality: formData.get("reality") as string,
      advantage: formData.get("advantage") as string,
      sort_order: Number(formData.get("sort_order")) || 0,
    };

    try {
      if (editingMyth) {
        await updateMyth.mutateAsync({ id: editingMyth.id, ...mythData });
        toast({ title: "Müüt uuendatud!" });
      } else {
        await createMyth.mutateAsync(mythData);
        toast({ title: "Müüt lisatud!" });
      }
      closeMythDialog();
    } catch (error) {
      toast({
        title: "Viga",
        description: editingMyth ? "Müüdi uuendamine ebaõnnestus" : "Müüdi lisamine ebaõnnestus",
        variant: "destructive",
      });
    }
  };

  const mythsByCategory = MYTH_CATEGORIES.map(cat => ({
    ...cat,
    myths: myths.filter(m => m.category === cat.value),
  }));

  const competitorBrands = brands.filter((b) => !b.is_primary);

  return (
    <Layout>
      <div className="space-y-8">
        <div className="rounded-xl bg-gradient-to-r from-primary to-primary/80 p-8 text-primary-foreground">
          <h1 className="text-3xl font-bold">Administreerimine</h1>
          <p className="mt-2 text-primary-foreground/80">
            Halda tehnikaid, võrdlusandmeid ja konkurentsieeliseid.
          </p>
        </div>

        <Tabs defaultValue="equipment" className="space-y-6">
          <TabsList>
            <TabsTrigger value="equipment" className="gap-2">
              <Tractor className="h-4 w-4" />
              Tehnika
            </TabsTrigger>
            <TabsTrigger value="arguments" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Argumendid
            </TabsTrigger>
            <TabsTrigger value="myths" className="gap-2">
              <MessageSquareWarning className="h-4 w-4" />
              Müüdid
            </TabsTrigger>
          </TabsList>

          <TabsContent value="equipment" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Tehnika nimekiri</h2>
              <Dialog open={equipmentDialogOpen} onOpenChange={(open) => {
                if (!open) closeEquipmentDialog();
                else setEquipmentDialogOpen(true);
              }}>
                <DialogTrigger asChild>
                  <Button className="gap-2" onClick={() => setEditingEquipment(null)}>
                    <Plus className="h-4 w-4" />
                    Lisa tehnika
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingEquipment ? "Muuda tehnikat" : "Lisa uus tehnika"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleEquipmentSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="equipment_type_id">Tüüp</Label>
                        <Select
                          name="equipment_type_id"
                          defaultValue={editingEquipment?.equipment_type_id || combineType?.id}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {types.map((type) => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.name_et}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="brand_id">Bränd</Label>
                        <Select
                          name="brand_id"
                          required
                          defaultValue={editingEquipment?.brand_id}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Vali bränd" />
                          </SelectTrigger>
                          <SelectContent>
                            {brands.map((brand) => (
                              <SelectItem key={brand.id} value={brand.id}>
                                {brand.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="model_name">Mudeli nimi</Label>
                        <Input
                          name="model_name"
                          required
                          placeholder="nt. S780"
                          defaultValue={editingEquipment?.model_name}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="power_class_id">Jõuklass</Label>
                        <Select
                          name="power_class_id"
                          defaultValue={editingEquipment?.power_class_id || undefined}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Vali jõuklass" />
                          </SelectTrigger>
                          <SelectContent>
                            {powerClasses.map((pc) => (
                              <SelectItem key={pc.id} value={pc.id}>
                                {pc.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="engine_power_hp">Võimsus (hj)</Label>
                        <Input
                          name="engine_power_hp"
                          type="number"
                          placeholder="473"
                          defaultValue={editingEquipment?.engine_power_hp ?? ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="grain_tank_liters">Bunker (l)</Label>
                        <Input
                          name="grain_tank_liters"
                          type="number"
                          placeholder="14100"
                          defaultValue={editingEquipment?.grain_tank_liters ?? ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="header_width_m">Heedri laius (m)</Label>
                        <Input
                          name="header_width_m"
                          type="number"
                          step="0.1"
                          placeholder="10.7"
                          defaultValue={editingEquipment?.header_width_m ?? ""}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="weight_kg">Kaal (kg)</Label>
                        <Input
                          name="weight_kg"
                          type="number"
                          placeholder="18500"
                          defaultValue={editingEquipment?.weight_kg ?? ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fuel_consumption_lh">Kütusekulu (l/h)</Label>
                        <Input
                          name="fuel_consumption_lh"
                          type="number"
                          step="0.1"
                          placeholder="45"
                          defaultValue={editingEquipment?.fuel_consumption_lh ?? ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="expected_lifespan_years">Eluiga (a)</Label>
                        <Input
                          name="expected_lifespan_years"
                          type="number"
                          defaultValue={editingEquipment?.expected_lifespan_years ?? 10}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price_eur">Hind (€)</Label>
                        <Input
                          name="price_eur"
                          type="number"
                          placeholder="450000"
                          defaultValue={editingEquipment?.price_eur ?? ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="annual_maintenance_eur">Hooldus/aastas (€)</Label>
                        <Input
                          name="annual_maintenance_eur"
                          type="number"
                          placeholder="12000"
                          defaultValue={editingEquipment?.annual_maintenance_eur ?? ""}
                        />
                      </div>
                    </div>

                    {/* New fields from brochures */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fuel_tank_liters">Kütusepaak (L)</Label>
                        <Input
                          name="fuel_tank_liters"
                          type="number"
                          placeholder="950"
                          defaultValue={editingEquipment?.fuel_tank_liters ?? ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cleaning_area_m2">Puhasti pindala (m²)</Label>
                        <Input
                          name="cleaning_area_m2"
                          type="number"
                          step="0.1"
                          placeholder="5.9"
                          defaultValue={editingEquipment?.cleaning_area_m2 ?? ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rotor_diameter_mm">Rootori läbimõõt (mm)</Label>
                        <Input
                          name="rotor_diameter_mm"
                          type="number"
                          placeholder="834"
                          defaultValue={editingEquipment?.rotor_diameter_mm ?? ""}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="throughput_tons_h">Läbilaskevõime (t/h)</Label>
                        <Input
                          name="throughput_tons_h"
                          type="number"
                          step="0.1"
                          placeholder="100"
                          defaultValue={editingEquipment?.throughput_tons_h ?? ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="engine_displacement_liters">Mootori töömaht (L)</Label>
                        <Input
                          name="engine_displacement_liters"
                          type="number"
                          step="0.1"
                          placeholder="13.6"
                          defaultValue={editingEquipment?.engine_displacement_liters ?? ""}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <ImageUpload
                        name="image_url"
                        label="Toote pilt"
                        currentImageUrl={editingEquipment?.image_url}
                        onImageUploaded={setImageUrl}
                        folder="equipment"
                      />
                      <ImageUpload
                        name="threshing_system_image_url"
                        label="Peksusüsteemi pilt"
                        currentImageUrl={editingEquipment?.threshing_system_image_url}
                        onImageUploaded={setThreshingImageUrl}
                        folder="threshing"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="data_source_url">Andmete allikas (URL)</Label>
                      <Input
                        name="data_source_url"
                        type="url"
                        placeholder="https://..."
                        defaultValue={editingEquipment?.data_source_url ?? ""}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Märkused</Label>
                      <Textarea
                        name="notes"
                        placeholder="Lisamärkused..."
                        defaultValue={editingEquipment?.notes ?? ""}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={createEquipment.isPending || updateEquipment.isPending}
                    >
                      {createEquipment.isPending || updateEquipment.isPending
                        ? "Salvestan..."
                        : "Salvesta"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {(() => {
              // Group equipment by brand, John Deere first
              const johnDeereBrand = brands.find(b => b.name === "John Deere");
              const otherBrands = brands.filter(b => b.name !== "John Deere");
              const sortedBrands = johnDeereBrand ? [johnDeereBrand, ...otherBrands] : otherBrands;
              
              const equipmentByBrand = sortedBrands.map(brand => ({
                brand,
                items: equipment.filter(e => e.brand_id === brand.id),
              })).filter(group => group.items.length > 0);

              return equipmentByBrand.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 border border-border rounded-lg">
                  Tehnikaid pole veel lisatud
                </div>
              ) : (
                <div className="space-y-6">
                  {equipmentByBrand.map(({ brand, items }) => (
                    <div key={brand.id} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className={cn("font-semibold text-lg", getBrandTextColor(brand.name))}>{brand.name}</h3>
                        <Badge variant={brand.is_primary ? "default" : "secondary"}>
                          {items.length} mudelit
                        </Badge>
                      </div>
                      <div className="rounded-lg border border-border overflow-hidden">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Mudel</th>
                              <th>Tüüp</th>
                              <th>Võimsus</th>
                              <th>Hind</th>
                              <th className="w-28">Tegevused</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((item) => (
                              <tr key={item.id}>
                                <td className="font-medium">{item.model_name}</td>
                                <td>{item.equipment_type?.name_et}</td>
                                <td>{item.engine_power_hp ? `${item.engine_power_hp} hj` : "—"}</td>
                                <td>
                                  {item.price_eur
                                    ? new Intl.NumberFormat("et-EE", {
                                        style: "currency",
                                        currency: "EUR",
                                        maximumFractionDigits: 0,
                                      }).format(item.price_eur)
                                    : "—"}
                                </td>
                                <td>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => openEditEquipment(item)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => deleteEquipment.mutate(item.id)}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </TabsContent>

          <TabsContent value="arguments" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Konkurentsieelised</h2>
              <Dialog open={argumentDialogOpen} onOpenChange={(open) => {
                if (!open) closeArgumentDialog();
                else setArgumentDialogOpen(true);
              }}>
                <DialogTrigger asChild>
                  <Button className="gap-2" onClick={() => setEditingArgument(null)}>
                    <Plus className="h-4 w-4" />
                    Lisa argument
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingArgument ? "Muuda argumenti" : "Lisa uus argument"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleArgumentSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Konkurent</Label>
                        <Select
                          name="competitor_brand_id"
                          required
                          defaultValue={editingArgument?.competitor_brand_id}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Vali konkurent" />
                          </SelectTrigger>
                          <SelectContent>
                            {competitorBrands.map((brand) => (
                              <SelectItem key={brand.id} value={brand.id}>
                                {brand.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Kategooria</Label>
                        <Select
                          name="category"
                          defaultValue={editingArgument?.category || "technology"}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="technology">Tehnoloogia</SelectItem>
                            <SelectItem value="performance">Jõudlus</SelectItem>
                            <SelectItem value="fuel">Kütusesääst</SelectItem>
                            <SelectItem value="comfort">Mugavus</SelectItem>
                            <SelectItem value="service">Teenindus</SelectItem>
                            <SelectItem value="value">Väärtus</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="argument_title">Pealkiri</Label>
                        <Input
                          name="argument_title"
                          required
                          placeholder="nt. ActiveYield automaatika"
                          defaultValue={editingArgument?.argument_title}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="icon_name">Ikooni nimi</Label>
                        <Select
                          name="icon_name"
                          defaultValue={editingArgument?.icon_name || "Lightbulb"}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Lightbulb">Lambipirn (Tehnoloogia)</SelectItem>
                            <SelectItem value="Fuel">Kütus</SelectItem>
                            <SelectItem value="Zap">Välk (Jõudlus)</SelectItem>
                            <SelectItem value="Wrench">Mutrivõti (Hooldus)</SelectItem>
                            <SelectItem value="TrendingUp">Trend üles (Kasum)</SelectItem>
                            <SelectItem value="Shield">Kilp (Kvaliteet)</SelectItem>
                            <SelectItem value="Cpu">Protsessor (Tarkvara)</SelectItem>
                            <SelectItem value="Gauge">Mõõdik (Täpsus)</SelectItem>
                            <SelectItem value="Timer">Taimer (Aeg)</SelectItem>
                            <SelectItem value="PiggyBank">Säästupõrsas (Sääst)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Problem-Solution-Benefit fields */}
                    <div className="space-y-2">
                      <Label htmlFor="problem_text" className="flex items-center gap-2">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-destructive/10 text-xs text-destructive">!</span>
                        Probleem
                      </Label>
                      <Textarea
                        name="problem_text"
                        placeholder="Kirjelda kliendi probleem, nt 'Kõrge terakadu koristusel'"
                        rows={2}
                        defaultValue={editingArgument?.problem_text || ""}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="solution_text" className="flex items-center gap-2">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">✓</span>
                        John Deere lahendus
                      </Label>
                      <Textarea
                        name="solution_text"
                        required
                        placeholder="Kirjelda John Deere tehnoloogia lahendust, nt 'ActiveYield automaatika optimeerib...'"
                        rows={3}
                        defaultValue={editingArgument?.solution_text || editingArgument?.argument_description || ""}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="benefit_text" className="flex items-center gap-2">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-success/10 text-xs text-success">€</span>
                        Kasu kliendile
                      </Label>
                      <Input
                        name="benefit_text"
                        placeholder="nt '+3€/ha sääst' või '15% vähem seisakuid'"
                        defaultValue={editingArgument?.benefit_text || ""}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={createArgument.isPending || updateArgument.isPending}
                    >
                      {createArgument.isPending || updateArgument.isPending
                        ? "Salvestan..."
                        : "Salvesta"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {args.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Argumente pole veel lisatud
              </div>
            ) : (
              <div className="space-y-6">
                {competitorBrands.map((brand) => {
                  const brandArgs = args.filter((arg) => arg.competitor_brand_id === brand.id);
                  if (brandArgs.length === 0) return null;
                  
                  return (
                    <div key={brand.id} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">vs <span className={getBrandTextColor(brand.name)}>{brand.name}</span></h3>
                        <Badge variant="secondary" className="ml-auto">
                          {brandArgs.length} argumenti
                        </Badge>
                      </div>
                      
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {brandArgs.map((arg) => (
                          <div
                            key={arg.id}
                            className="rounded-lg border border-border bg-card p-4 relative group"
                          >
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditArgument(arg)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteArgument.mutate(arg.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                            <Badge variant="secondary" className="text-xs mb-2">
                              {arg.category}
                            </Badge>
                            <h4 className="font-semibold mb-2">{arg.argument_title}</h4>
                            {arg.problem_text && (
                              <p className="text-xs text-destructive mb-1">
                                <span className="font-medium">Probleem:</span> {arg.problem_text}
                              </p>
                            )}
                            <p className="text-sm text-muted-foreground mb-1">
                              <span className="font-medium text-primary">Lahendus:</span> {arg.solution_text || arg.argument_description}
                            </p>
                            {arg.benefit_text && (
                              <p className="text-sm font-medium text-success">
                                <span>Kasu:</span> {arg.benefit_text}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="myths" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Müütide haldamine</h2>
              <Dialog open={mythDialogOpen} onOpenChange={(open) => {
                if (!open) closeMythDialog();
                else setMythDialogOpen(true);
              }}>
                <DialogTrigger asChild>
                  <Button className="gap-2" onClick={() => setEditingMyth(null)}>
                    <Plus className="h-4 w-4" />
                    Lisa müüt
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingMyth ? "Muuda müüti" : "Lisa uus müüt"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleMythSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Kategooria</Label>
                        <Select
                          name="category"
                          required
                          defaultValue={editingMyth?.category || "finance"}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Vali kategooria" />
                          </SelectTrigger>
                          <SelectContent>
                            {MYTH_CATEGORIES.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sort_order">Järjestus</Label>
                        <Input
                          name="sort_order"
                          type="number"
                          defaultValue={editingMyth?.sort_order ?? 0}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="myth" className="flex items-center gap-2">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-destructive/10 text-xs text-destructive">!</span>
                        Müüt
                      </Label>
                      <Textarea
                        name="myth"
                        required
                        placeholder="Kirjelda levinud väärarusaama..."
                        rows={2}
                        defaultValue={editingMyth?.myth || ""}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reality" className="flex items-center gap-2">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-warning/10 text-xs text-warning">?</span>
                        Tegelikkus
                      </Label>
                      <Textarea
                        name="reality"
                        required
                        placeholder="Selgita tegelikku olukorda..."
                        rows={3}
                        defaultValue={editingMyth?.reality || ""}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="advantage" className="flex items-center gap-2">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">✓</span>
                        John Deere'i Eelis
                      </Label>
                      <Textarea
                        name="advantage"
                        required
                        placeholder="Too välja John Deere eelis..."
                        rows={3}
                        defaultValue={editingMyth?.advantage || ""}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={createMyth.isPending || updateMyth.isPending}
                    >
                      {createMyth.isPending || updateMyth.isPending
                        ? "Salvestan..."
                        : "Salvesta"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {mythsByCategory.map((category) => {
              const CategoryIcon = category.icon;
              return (
                <div key={category.value} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CategoryIcon className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-lg">{category.label}</h3>
                    <Badge variant="secondary" className="ml-auto">
                      {category.myths.length} müüti
                    </Badge>
                  </div>
                  
                  {category.myths.length === 0 ? (
                    <p className="text-sm text-muted-foreground pl-7">
                      Selles kategoorias pole veel müüte
                    </p>
                  ) : (
                    <div className="space-y-2 pl-7">
                      {category.myths.map((myth) => (
                        <div
                          key={myth.id}
                          className="rounded-lg border border-border bg-card p-4 relative group"
                        >
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditMyth(myth)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteMyth.mutate(myth.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                          
                          <p className="text-sm font-medium text-destructive mb-2">
                            <span className="font-semibold">Müüt:</span> {myth.myth}
                          </p>
                          <p className="text-sm text-muted-foreground mb-2">
                            <span className="font-semibold">Tegelikkus:</span> {myth.reality}
                          </p>
                          <p className="text-sm text-primary">
                            <span className="font-semibold">JD Eelis:</span> {myth.advantage}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {myths.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                Müüte pole veel lisatud
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
