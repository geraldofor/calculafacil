import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, Calculator as CalcIcon, RefreshCw, Trash2, AlertCircle } from 'lucide-react';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { formatDateTime } from '@/utils/formatters';

const Admin = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/admin/users')
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      toast({
        title: "Erro",
        description: error.response?.data?.detail || "Erro ao carregar dados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleActive = async (userId, currentStatus) => {
    try {
      await api.patch(`/api/admin/users/${userId}`, null, {
        params: { is_active: !currentStatus }
      });
      toast({
        title: "Sucesso",
        description: `Usuário ${!currentStatus ? 'ativado' : 'desativado'} com sucesso`,
      });
      loadData();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar usuário",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Tem certeza que deseja deletar o usuário ${userName}?`)) {
      return;
    }

    try {
      await api.delete(`/api/admin/users/${userId}`);
      toast({
        title: "Sucesso",
        description: "Usuário deletado com sucesso",
      });
      loadData();
    } catch (error) {
      toast({
        title: "Erro",
        description: error.response?.data?.detail || "Erro ao deletar usuário",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="admin-panel">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Painel Administrativo</h1>
          <p className="text-gray-600">Gerencie usuários e visualize estatísticas do sistema</p>
        </div>
        <Button onClick={loadData} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Usuários</p>
                <p className="text-3xl font-bold mt-2">{stats.users.total}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.users.recent_7_days} novos (7 dias)
                </p>
              </div>
              <Users className="h-12 w-12 text-blue-600 opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Usuários Ativos</p>
                <p className="text-3xl font-bold mt-2">{stats.users.active}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.users.admins} administradores
                </p>
              </div>
              <TrendingUp className="h-12 w-12 text-green-600 opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cálculos Totais</p>
                <p className="text-3xl font-bold mt-2">{stats.calculations.total}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Por todos os usuários
                </p>
              </div>
              <CalcIcon className="h-12 w-12 text-purple-600 opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Por Tipo</p>
                <div className="mt-2 space-y-1">
                  <p className="text-sm">Tarifas: <span className="font-semibold">{stats.calculations.tarifa}</span></p>
                  <p className="text-sm">Conversor: <span className="font-semibold">{stats.calculations.conversor}</span></p>
                  <p className="text-sm">Reemissão: <span className="font-semibold">{stats.calculations.reemissao}</span></p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Users Table */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Usuários Cadastrados</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2 font-semibold text-sm">Nome</th>
                <th className="text-left py-3 px-2 font-semibold text-sm">Email</th>
                <th className="text-left py-3 px-2 font-semibold text-sm">Role</th>
                <th className="text-left py-3 px-2 font-semibold text-sm">Status</th>
                <th className="text-left py-3 px-2 font-semibold text-sm">Assinatura</th>
                <th className="text-left py-3 px-2 font-semibold text-sm">Cadastro</th>
                <th className="text-left py-3 px-2 font-semibold text-sm">Último Login</th>
                <th className="text-left py-3 px-2 font-semibold text-sm">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-2">{user.full_name}</td>
                  <td className="py-3 px-2 text-sm text-gray-600">{user.email}</td>
                  <td className="py-3 px-2">
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                  </td>
                  <td className="py-3 px-2">
                    <Badge variant={user.is_active ? 'default' : 'destructive'}>
                      {user.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </td>
                  <td className="py-3 px-2">
                    <Badge 
                      variant={
                        user.subscription_status === 'active' ? 'default' : 
                        user.subscription_status === 'trial' ? 'secondary' : 
                        'destructive'
                      }
                    >
                      {user.subscription_status}
                    </Badge>
                  </td>
                  <td className="py-3 px-2 text-sm text-gray-600">
                    {formatDateTime(user.created_at)}
                  </td>
                  <td className="py-3 px-2 text-sm text-gray-600">
                    {user.last_login ? formatDateTime(user.last_login) : '-'}
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleActive(user.id, user.is_active)}
                        disabled={user.role === 'admin'}
                      >
                        {user.is_active ? 'Desativar' : 'Ativar'}
                      </Button>
                      {user.role !== 'admin' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteUser(user.id, user.full_name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Info Card */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900">Informações do Painel Admin</h3>
            <ul className="text-sm text-blue-800 mt-2 space-y-1">
              <li>• Apenas administradores podem acessar este painel</li>
              <li>• Não é possível deletar ou desativar contas de administrador</li>
              <li>• O sistema de pagamentos será implementado em breve</li>
              <li>• Status "trial" = período de teste (futuro: 7 ou 30 dias)</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Admin;
