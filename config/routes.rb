MonsterFleet::Application.routes.draw do

  resources :fleets
  resources :monsters

  root :to => 'monsters#app'

end
