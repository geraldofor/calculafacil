import api from './api';

export const calculationService = {
  async saveCalculation(calculationType, gds, inputData, result) {
    const response = await api.post('/api/calculations/', {
      calculation_type: calculationType,
      gds: gds,
      input_data: inputData,
      result: result,
    });
    return response.data;
  },

  async getCalculations(calculationType = null, limit = 50) {
    const params = { limit };
    if (calculationType) {
      params.calculation_type = calculationType;
    }
    const response = await api.get('/api/calculations/', { params });
    return response.data;
  },

  async deleteCalculation(calculationId) {
    await api.delete(`/api/calculations/${calculationId}`);
  },
};
