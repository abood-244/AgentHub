import React, { useState, useEffect } from 'react';
import './LLMModelsScreen.css';
import { LLMModel } from '../../types';
import { llmModelService } from '../../services/apiServices';
import { Card, CardHeader, CardContent, CardFooter } from '../../design-system/components/Card';
import { Badge } from '../../design-system/components/Badge';
import { Button } from '../../design-system/components/Button';
import { Cpu, CheckCircle2, Shield, Layers, Plus } from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';

export interface LLMModelsScreenProps {
  onAssignToWorkspace?: (modelId: string) => void;
}

export const LLMModelsScreen: React.FC<LLMModelsScreenProps> = () => {
  const { language, t } = useTranslation();
  const isEn = language === 'en';

  const [models, setModels] = useState<LLMModel[]>([]);

  useEffect(() => {
    const fetchModels = async () => {
      const data = await llmModelService.getAll();
      setModels(data);
    };
    fetchModels();
  }, []);

  return (
    <div className="ah-llm-screen">
      {/* Title & Architecture explanation */}
      <div className="ah-llm-header">
        <div>
          <h2 className="ah-llm-title">{t('navLLMModels')}</h2>
          <p className="ah-llm-desc">
            {isEn
              ? 'Globally managed foundation AI models. Workspaces do not duplicate models; they select and configure an Agent Profile using one of these models.'
              : 'نماذج الذكاء الاصطناعي العالمية المعتمدة في الجامعة. لا تقوم الأقسام بتكرار النماذج، بل تختار نموذجاً وتضبط وكيلها التفاعلي (Agent Profile) استناداً إليه.'}
          </p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />}>
          {isEn ? 'Add Foundation Model' : 'إضافة نموذج ذكاء اصطناعي'}
        </Button>
      </div>

      {/* Models Grid */}
      <div className="ah-llm-grid">
        {models.map(model => (
          <Card key={model.id} className="ah-llm-card">
            <CardHeader
              title={
                <div className="ah-llm-title-row">
                  <span className="ah-llm-name">{model.name}</span>
                  {model.isRecommended && (
                    <Badge variant="primary" size="sm">
                      {isEn ? 'Recommended' : 'موصى به'}
                    </Badge>
                  )}
                </div>
              }
              action={
                <span
                  className="ah-llm-provider-badge"
                  style={{ backgroundColor: `${model.badgeColor}15`, color: model.badgeColor }}
                >
                  {model.provider}
                </span>
              }
            />

            <CardContent>
              <p className="ah-llm-body">
                {isEn ? model.descriptionEn : model.description}
              </p>

              <div className="ah-llm-specs">
                <div className="ah-llm-spec-item">
                  <span className="ah-llm-spec-label">Identifier</span>
                  <span className="ah-llm-spec-val ah-llm-spec-code">{model.modelIdentifier}</span>
                </div>
                <div className="ah-llm-spec-item">
                  <span className="ah-llm-spec-label">Context Window</span>
                  <span className="ah-llm-spec-val">{(model.contextWindow / 1000).toFixed(0)}k tokens</span>
                </div>
              </div>
            </CardContent>

            <CardFooter>
              <div className="ah-llm-footer-content">
                <div className="ah-llm-assigned-stat">
                  <Layers size={16} color="#0066FF" />
                  <span>
                    {isEn
                      ? `Used by ${model.assignedWorkspacesCount} Workspaces`
                      : `مستخدم في ${model.assignedWorkspacesCount} مساحات عمل`}
                  </span>
                </div>
                <Badge variant={model.isEnabled ? 'success' : 'neutral'} dot>
                  {model.isEnabled ? (isEn ? 'Active' : 'متاح') : (isEn ? 'Disabled' : 'معطل')}
                </Badge>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};
