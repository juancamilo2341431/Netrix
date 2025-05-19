import ClientLayout from "@/components/layout/ClientLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoaderCircle, X, Save } from "lucide-react";
import EmailConfirmationModal from "@/components/auth/EmailConfirmationModal";
import ProfileInfo from "@/components/profile/ProfileInfo";
import ProfileEditForm from "@/components/profile/ProfileEditForm";
import SecurityTab from "@/components/profile/SecurityTab";
import ProfileHeader from "@/components/profile/ProfileHeader";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";

export default function Profile() {
  const {
    user,
    profile,
    loading,
    editMode,
    setEditMode,
    updating,
    showEmailModal,
    setShowEmailModal,
    initialFormValues,
    setInitialFormValues,
    phoneValue,
    setPhoneValue,
    formatDate,
    handleSaveProfile
  } = useProfile();

  if (loading) {
    return (
      <ClientLayout hideCartIconOnMobile={true}>
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <LoaderCircle className="animate-spin text-nytrix-purple mr-2 h-6 w-6" />
          <div className="text-nytrix-purple">Cargando perfil...</div>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout hideCartIconOnMobile={true}>
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold text-gradient-nytrix mb-8">Mi Perfil</h1>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="info">Información Personal</TabsTrigger>
            <TabsTrigger value="security">Seguridad</TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <ProfileHeader 
                  editMode={editMode}
                  updating={updating}
                  onEditClick={() => setEditMode(true)}
                  onCancelClick={() => setEditMode(false)}
                  onSaveClick={() => {
                    if (initialFormValues) {
                      handleSaveProfile(initialFormValues);
                    }
                  }}
                />
              </CardHeader>
              <CardContent className="space-y-6">
                {editMode ? (
                  <ProfileEditForm
                    initialData={initialFormValues}
                    phoneValue={phoneValue}
                    onPhoneChange={(value) => {
                      setPhoneValue(value);
                      setInitialFormValues(prev => ({...prev, phone: value}));
                    }}
                    onSubmit={handleSaveProfile}
                  />
                ) : (
                  <ProfileInfo 
                    profile={profile} 
                    user={user}
                    onEdit={() => setEditMode(true)}
                    formatDate={formatDate}
                  />
                )}
              </CardContent>
              
              {/* Botones Cancelar/Guardar - SOLO visibles en móvil (sm:hidden) */}
              {editMode && (
                <div className="flex flex-row sm:hidden justify-center gap-4 px-6 pb-6 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setEditMode(false)}
                    className="text-destructive border-destructive/30 hover:bg-destructive/10"
                  >
                    <X className="mr-2 h-4 w-4" /> Cancelar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      if (initialFormValues) {
                        handleSaveProfile(initialFormValues);
                      }
                    }}
                    disabled={updating}
                    className="text-green-600 border-green-600/30 hover:bg-green-600/10"
                  >
                    {updating ? (
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Guardar
                  </Button>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <SecurityTab />
          </TabsContent>
        </Tabs>
      </div>

      {/* Email confirmation modal */}
      <EmailConfirmationModal 
        open={showEmailModal}
        onClose={() => setShowEmailModal(false)}
      />
    </ClientLayout>
  );
}
