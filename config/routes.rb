MonsterFleet::Application.routes.draw do

  resources :fleets do
    member do
      post :webcam
    end
  end
  resources :monsters do
    member do
      post :webcam
    end
  end

  root :to => 'monsters#app'

end
