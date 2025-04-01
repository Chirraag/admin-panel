import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PainPointsInputProps {
  painPoints: string[];
  onChange: (painPoints: string[]) => void;
}

export function PainPointsInput({ painPoints, onChange }: PainPointsInputProps) {
  const addPainPoint = () => {
    onChange([...painPoints, '']);
  };

  const removePainPoint = (index: number) => {
    onChange(painPoints.filter((_, i) => i !== index));
  };

  const updatePainPoint = (index: number, value: string) => {
    const updatedPainPoints = [...painPoints];
    updatedPainPoints[index] = value;
    onChange(updatedPainPoints);
  };

  return (
    <div className="space-y-2">
      {painPoints.map((painPoint, index) => (
        <div key={index} className="flex gap-2">
          <Input
            value={painPoint}
            onChange={(e) => updatePainPoint(index, e.target.value)}
            placeholder="Enter pain point"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removePainPoint(index)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={addPainPoint}
        className="w-full"
      >
        Add Pain Point
      </Button>
    </div>
  );
}