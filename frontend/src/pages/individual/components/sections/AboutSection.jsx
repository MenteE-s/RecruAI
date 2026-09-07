import { FiUser } from "react-icons/fi";
import Card from "../../../../components/ui/Card";
import SectionHeader from "../SectionHeader";

export default function AboutSection({ about, onEdit }) {
  return (
    <Card>
      <SectionHeader
        icon={<FiUser size={18} />}
        title="About"
        onAdd={() => onEdit(about)}
      />
      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
        {about?.summary || "Tell us about yourself..."}
      </p>
    </Card>
  );
}
