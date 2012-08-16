MonsterFleet::Application.routes.draw do

  resources :monsters

  root :to => 'monsters#app'

end
