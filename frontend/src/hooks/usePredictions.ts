import { useCallback } from 'react';
import { usePredictionStore } from '../context/store';

export const usePredictions = () => {
  const { userPredictions, isLoading, fetchUserPredictions, submitPrediction } = usePredictionStore();

  const loadPredictions = useCallback(async (email: string, matchId?: number) => {
    return await fetchUserPredictions(email, matchId);
  }, [fetchUserPredictions]);

  const savePrediction = useCallback(async (
    email: string,
    matchId: number,
    udf: number,
    ldf: number,
    nda: number
  ) => {
    return await submitPrediction({ Email: email, MatchID: matchId, UDF_Score: udf, LDF_Score: ldf, NDA_Score: nda });
  }, [submitPrediction]);

  return {
    predictions: userPredictions,
    isLoading,
    loadPredictions,
    savePrediction
  };
};
