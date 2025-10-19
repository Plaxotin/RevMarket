import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { seedTestData } from "@/utils/seedData";
import { Loader2, Database, CheckCircle, AlertCircle } from "lucide-react";

const SeedData = () => {
  const [isSeeding, setIsSeeding] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSeedData = async () => {
    setIsSeeding(true);
    setResult(null);
    
    try {
      await seedTestData();
      setResult({
        success: true,
        message: "Каталог успешно заполнен тестовыми данными!"
      });
    } catch (error) {
      setResult({
        success: false,
        message: `Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar onCityChange={() => {}} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-6 h-6" />
                Заполнение каталога тестовыми данными
              </CardTitle>
              <CardDescription>
                Этот инструмент создаст 65 тестовых запросов (по 5 в каждой из 13 категорий) 
                от имени текущего авторизованного пользователя.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Что будет создано:</h3>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Электроника - 5 запросов</li>
                  <li>• Услуги - 5 запросов</li>
                  <li>• Дизайн - 5 запросов</li>
                  <li>• Мебель - 5 запросов</li>
                  <li>• Образование - 5 запросов</li>
                  <li>• Авто - 5 запросов</li>
                  <li>• Одежда, обувь, аксессуары - 5 запросов</li>
                  <li>• Хобби и отдых - 5 запросов</li>
                  <li>• Животные - 5 запросов</li>
                  <li>• Запчасти - 5 запросов</li>
                  <li>• Детские товары - 5 запросов</li>
                  <li>• Недвижимость - 5 запросов</li>
                  <li>• Красота и здоровье - 5 запросов</li>
                </ul>
                <p className="text-sm font-medium mt-2">Всего: 65 запросов</p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-800">Внимание!</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Убедитесь, что вы авторизованы в системе. Все запросы будут созданы 
                      от вашего имени и появятся в вашем профиле.
                    </p>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleSeedData}
                disabled={isSeeding}
                className="w-full"
                size="lg"
              >
                {isSeeding ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Создание запросов...
                  </>
                ) : (
                  <>
                    <Database className="w-5 h-5 mr-2" />
                    Заполнить каталог
                  </>
                )}
              </Button>

              {result && (
                <div className={`p-4 rounded-lg border ${
                  result.success 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    <p className={`font-medium ${
                      result.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {result.message}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SeedData;
