import { useCallback, useState } from 'react';
import { apiService } from '../services/api';
import { Prediction } from '../types';

export const usePredictions = () => {
  const [userPredictions, setUserPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadPredictions = useCallback(async (email: string, matchId?: number) => {
    setIsLoading(true);
    try {
      const response = await apiService.getUserPredictions({
        email,
        matchId: matchId?.toString(),
      });
      const predictions = Array.isArray(response.data?.data)
        ? response.data.data
        : [];
      setUserPredictions(predictions);
      return predictions;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const savePrediction = useCallback(async (
    email: string,
    matchId: number,
    udf: number,
    ldf: number,
    nda: number
  ) => {
    return await apiService.submitPrediction({
      Email: email,
      MatchID: matchId,
      UDF_Score: udf,
      LDF_Score: ldf,
      NDA_Score: nda,
    });
  }, []);

  return {
    predictions: userPredictions,
    isLoading,
    loadPredictions,
    savePrediction
  };
};
